import {
  AccessSubmissionStatus,
  OrderStatus,
  OrderTrackingEventType,
  PaymentMethodType,
  PaymentStatus,
  Prisma,
  Role,
  TrackingActorType,
} from '@prisma/client';
import httpStatus from 'http-status';
import { env } from '../../../config/env';
import { getIO } from '../../../config/socket';
import { parseS3Url, signS3GetObject } from '../../../lib/s3Presign';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiErrors';
import { socketManager } from '../../helpers/socketManager';
import { auditLogService } from '../../services/auditLog.service';
import { cartService } from '../cart/cart.service';
import { CartRepository } from '../cart/repositories/cart.repository';
import { labProviderRegistryService } from '../lab-integration/services/lab-provider-registry.service';
import { orderTrackingService } from '../order-tracking/services/order-tracking.service';
import { orderPatientService, UpsertOrderPatientInput } from '../patients/order-patient/services/order-patient.service';
import { promoCodesService } from '../promo-codes/services/promo-codes.service';
import { requisitionsService } from '../requisitions/services/requisitions.service';
import { NotificationService } from '../notifications/notifications.service';
import stateRestrictionService from '../stateRestriction/stateRestriction.service';
import { toOrderSummary } from './mappers/order.mapper';
import { OrdersRepository } from './repositories/orders.repository';
import { orderStateMachine } from './state-machine/order-state-machine';

type CreateDirectOrderParams = {
  userId: string | null;
  req?: any;
  labTestId: string;
  accessPayloadJson?: Record<string, unknown>;
  drawCenterId?: string | null;
  laboratoryId?: string | null;
  laboratoryCode?: string | null;
};

type CreateOrderFromCartParams = {
  userId: string;
  req: any;
  patient: UpsertOrderPatientInput;
  promoCode?: string;
  drawCenterId?: string | null;
  idempotencyKey?: string;
  state?: string;
};

type MarkOrderPaidParams = {
  orderId: string;
  stripePaymentIntentId: string;
  paymentMethodType?: PaymentMethodType | null;
  paymentSnapshotJson?: Prisma.InputJsonValue | null;
  lastPaymentEventId?: string | null;
};

type MarkLabOrderPlacedParams = {
  orderId: string;
  accessOrderId?: string;
  requisitionPdfUrl?: string;
  requisitionPdfPath?: string;
  labVisitInstructions?: string;
  confirmedLabLocation?: Record<string, unknown>;
  rawPayload?: Prisma.InputJsonValue | null;
  rawResponse?: Prisma.InputJsonValue | null;
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const buildOrderNumber = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EZ-${timePart}-${randomPart}`;
};

const toJson = (value: unknown) =>
  value === undefined ? Prisma.JsonNull : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);

const toNullableJsonValue = (value: Prisma.InputJsonValue | null | undefined) =>
  value === undefined || value === null ? Prisma.JsonNull : value;

class OrderService {
  private readonly repository = new OrdersRepository();
  private readonly cartRepository = new CartRepository();

  private buildOrderNotificationData(order: Awaited<ReturnType<OrderService['getOrderById']>>, extra: Record<string, unknown> = {}) {
    const patientName = [order.patient?.firstName, order.patient?.lastName].filter(Boolean).join(' ');

    return {
      orderId: order.orderNumber || order.id,
      orderUuid: order.id,
      userName: patientName || 'there',
      amount: `${Number(order.total).toFixed(2)} ${order.currency}`,
      testCount: String(order.orderItems?.length || 0),
        clickAction: `/dashboard/customer/results/${order.id}`,
      ...extra,
    };
  }

  private async notifyOrder(
    orderId: string,
    type:
      | 'ORDER_CREATED'
      | 'PAYMENT_SUCCEEDED'
      | 'PAYMENT_FAILED'
      | 'ORDER_CONFIRMED'
      | 'ORDER_IN_PROGRESS'
      | 'REQUISITION_READY'
      | 'LAB_SUBMISSION_FAILED'
      | 'MANUAL_REVIEW_REQUIRED',
    extra: Record<string, unknown> = {},
  ) {
    try {
      const order = await this.getOrderById(orderId);
      if (!order.userId) {
        return;
      }

      await NotificationService.sendTemplateNotification(
        order.userId,
        type,
        this.buildOrderNotificationData(order, extra),
      );
    } catch (error) {
      console.error(`[OrderService] Failed to send ${type} notification`, error);
    }
  }

  private computeProcessingFee(subtotal: number) {
    const percent = Number(env.PROCESSING_FEE_PERCENT || 0);
    const flat = Number(env.PROCESSING_FEE_FLAT || 0);
    return round2((subtotal * percent) / 100 + flat);
  }

  private async emitTrackingUpdate(orderId: string) {
    try {
      const tracking = await this.getOrderWithTrackingStatus(orderId);
      const order = await this.repository.findById(orderId);
      if (order?.userId) {
        socketManager.emitToUser(order.userId, 'order:tracking-update', tracking);
      }

      getIO().to(`order:${orderId}`).emit('order:tracking-update', tracking);
    } catch (error) {
      console.error('[OrderService] Failed to emit tracking update', error);
    }
  }

  private async emitManualReviewQueueUpdate(orderId: string) {
    try {
      const order = await this.repository.findById(orderId);
      if (!order) {
        return;
      }

      await socketManager.emitToRole(Role.SUPER_ADMIN, 'order:manual-review-queue-update', {
        orderId: order.id,
        status: order.orderStatus,
        manualReviewRequired: order.manualReviewRequired,
        updatedAt: order.updatedAt.toISOString(),
      });
    } catch (error) {
      console.error('[OrderService] Failed to emit manual review queue update', error);
    }
  }

  async assertExistingOrderOrderingAllowed(params: { orderId: string; req: any; checkoutState?: string | null }) {
    const order = await this.repository.findById(params.orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    for (const item of order.orderItems || []) {
      await stateRestrictionService.assertOrderingAllowed({
        req: params.req,
        checkoutState: params.checkoutState || order.patient?.state || undefined,
        labTestId: item.labTestId,
        testId: item.testId,
        laboratoryId: order.laboratoryId,
        laboratoryCode: order.laboratory?.code,
      });
    }

    return order;
  }

  private async transitionOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    params?: {
      actorType?: TrackingActorType;
      actorId?: string | null;
      eventType?: OrderTrackingEventType;
      message?: string;
      tx?: Prisma.TransactionClient;
      updateData?: Prisma.OrderUpdateInput;
      metadata?: Record<string, unknown>;
    },
  ) {
    const db = params?.tx || prisma;
    const current = await db.order.findUnique({
      where: { id: orderId },
      select: { orderStatus: true },
    });

    if (!current) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    orderStateMachine.assertTransition(current.orderStatus, nextStatus);

    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        orderStatus: nextStatus,
        currentTrackingStep: orderStateMachine.getStep(nextStatus),
        trackingUpdatedAt: new Date(),
        lastTransitionedAt: new Date(),
        ...(params?.updateData || {}),
      },
      include: {
        patient: true,
        orderItems: true,
        requisitions: true,
        drawCenter: true,
        laboratory: true,
      },
    });

    await orderTrackingService.track(
      {
        orderId,
        eventType: params?.eventType || 'ORDER_CREATED',
        previousStatus: current.orderStatus,
        nextStatus,
        actorType: params?.actorType || 'SYSTEM',
        actorId: params?.actorId || null,
        message: params?.message,
        metadata: params?.metadata || null,
      },
      db,
    );

    return updated;
  }

  private distributeDiscountAcrossItems(
    items: Awaited<ReturnType<CartRepository['findUserCart']>>,
    totalDiscount: number,
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.effectiveUnitPrice) * item.quantity,
      0,
    );

    let remaining = round2(totalDiscount);

    return items.map((item, index) => {
      const lineSubtotal = round2(Number(item.effectiveUnitPrice) * item.quantity);
      const proportional =
        index === items.length - 1 || subtotal === 0
          ? remaining
          : round2((lineSubtotal / subtotal) * totalDiscount);
      remaining = round2(remaining - proportional);

      return {
        itemId: item.id,
        discountAmount: proportional,
      };
    });
  }

  async createOrderFromCart(params: CreateOrderFromCartParams) {
    const cart = await cartService.validateCart({
      userId: params.userId,
      req: params.req,
      state: params.state || params.patient.state || undefined,
      promoCode: params.promoCode,
    });

    const cartItems = await this.cartRepository.findUserCart(params.userId);
    if (!cartItems.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cart is empty');
    }

    const existing = params.idempotencyKey
      ? await prisma.order.findFirst({
          where: { userId: params.userId, idempotencyKey: params.idempotencyKey },
        })
      : null;
    if (existing) {
      return this.getOrderById(existing.id);
    }

    const processingFee = this.computeProcessingFee(cart.total);
    const total = round2(cart.total + processingFee);
    const itemDiscounts = this.distributeDiscountAcrossItems(cartItems, cart.discount);

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: params.userId,
          laboratoryId: cart.laboratoryId!,
          drawCenterId: params.drawCenterId || cartItems[0]?.drawCenterId || null,
          orderNumber: buildOrderNumber(),
          currency: cartItems[0]?.currency || 'USD',
          subtotal: cart.subtotal,
          processingFee,
          discount: cart.discount,
          total,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.PENDING_PAYMENT,
          accessSubmissionStatus: AccessSubmissionStatus.NOT_SUBMITTED,
          customerEmailSnapshot: params.patient.email || null,
          customerPhoneSnapshot: params.patient.phoneNumber || null,
          pricingSnapshotJson: toJson({
            subtotal: cart.subtotal,
            discount: cart.discount,
            processingFee,
            total,
            promoCode: cart.promoCode,
            promoClamped: cart.promoClamped,
          }),
          idempotencyKey: params.idempotencyKey || null,
          currentTrackingStep: orderStateMachine.getStep(OrderStatus.PENDING_PAYMENT),
          trackingUpdatedAt: new Date(),
          patient: {
            create: {
              relationToUser: params.patient.relationToUser || 'SELF',
              firstName: params.patient.firstName.trim(),
              lastName: params.patient.lastName.trim(),
              dateOfBirth: params.patient.dateOfBirth || null,
              gender: params.patient.gender || null,
              phoneNumber: params.patient.phoneNumber || null,
              email: params.patient.email || null,
              addressLine1: params.patient.addressLine1 || null,
              addressLine2: params.patient.addressLine2 || null,
              city: params.patient.city || null,
              state: params.patient.state || null,
              zipCode: params.patient.zipCode || null,
              metadata:
                params.patient.metadata === undefined
                  ? Prisma.JsonNull
                  : (params.patient.metadata as Prisma.InputJsonValue),
            },
          },
          orderItems: {
            create: cartItems.map((item) => {
              const itemDiscount = itemDiscounts.find((entry) => entry.itemId === item.id)?.discountAmount || 0;
              const lineDiscountPerUnit = round2(itemDiscount / item.quantity);

              return {
                testId: item.testId,
                labTestId: item.labTestId,
                labTestCode: item.labTest.labTestCode,
                testName: item.test.name,
                laboratoryName: item.laboratory.name,
                quantity: item.quantity,
                baseRetailPrice: item.baseRetailPrice,
                effectiveUnitPrice: item.effectiveUnitPrice,
                discountAmount: itemDiscount,
                price: round2((Number(item.effectiveUnitPrice) - lineDiscountPerUnit) * item.quantity),
                labCost: item.labTest.labCost,
                currency: item.currency,
                pricingSnapshotJson: toJson({
                  quantity: item.quantity,
                  unitPrice: item.effectiveUnitPrice,
                  baseRetailPrice: item.baseRetailPrice,
                  discountAmount: itemDiscount,
                }),
              };
            }),
          },
        },
        include: {
          patient: true,
          orderItems: true,
          requisitions: true,
          drawCenter: true,
          laboratory: true,
        },
      });

      if (params.promoCode) {
        const promoResult = await promoCodesService.validateForCheckout({
          code: params.promoCode,
          subtotal: cart.subtotal,
          items: cartItems.map((item) => ({
            quantity: item.quantity,
            effectiveUnitPrice: Number(item.effectiveUnitPrice),
            labCost: Number(item.labTest.labCost),
          })),
        });

        await tx.orderPromoCode.create({
          data: {
            orderId: order.id,
            promoCodeId: promoResult.promo.id,
            appliedCode: promoResult.promo.code,
            discountType: promoResult.promo.discountType,
            discountValue: promoResult.promo.discountValue,
            pricingStrategy: promoResult.promo.pricingStrategy,
            discountAmount: promoResult.appliedDiscount,
          },
        });

        await tx.promoCode.update({
          where: { id: promoResult.promo.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      await orderTrackingService.track(
        {
          orderId: order.id,
          eventType: 'ORDER_CREATED',
          previousStatus: null,
          nextStatus: OrderStatus.PENDING_PAYMENT,
          actorType: 'CUSTOMER',
          actorId: params.userId,
          message: 'Order created from cart and awaiting payment',
          metadata: {
            itemCount: cartItems.length,
            promoCode: params.promoCode || null,
          },
        },
        tx,
      );

      return order;
    });

    await this.cartRepository.deleteManyByUserId(params.userId);
    await this.emitTrackingUpdate(created.id);
    await this.notifyOrder(created.id, 'ORDER_CREATED');
    return this.getOrderById(created.id);
  }

  async createOrder(params: CreateDirectOrderParams) {
    const labTest = await prisma.labTest.findFirst({
      where: {
        OR: [{ id: params.labTestId }, { testId: params.labTestId }],
        isAvailable: true,
        isVisible: true,
        laboratory: {
          isActive: true,
          isVisibleToCustomers: true,
          ...(params.laboratoryId ? { id: params.laboratoryId } : {}),
          ...(params.laboratoryCode ? { code: params.laboratoryCode } : {}),
        },
      },
      include: {
        laboratory: true,
        test: true,
      },
      orderBy: [{ salePrice: 'asc' }, { retailPrice: 'asc' }],
    });

    if (!labTest) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Lab test not found');
    }

    const patient = (params.accessPayloadJson?.patient || {}) as Record<string, unknown>;
    const checkoutState =
      typeof patient.state === 'string'
        ? patient.state
        : typeof patient.addressState === 'string'
          ? patient.addressState
          : null;

    if (params.req) {
      await stateRestrictionService.assertOrderingAllowed({
        req: params.req,
        checkoutState,
        labTestId: labTest.id,
        testId: labTest.testId,
        laboratoryId: labTest.laboratoryId,
        laboratoryCode: labTest.laboratory.code,
      });
    }

    const createdOrderId = await prisma.$transaction(async (tx) => {
      const subtotal = round2(Number(labTest.salePrice ?? labTest.retailPrice));
      const processingFee = this.computeProcessingFee(subtotal);
      const total = round2(subtotal + processingFee);

      const order = await tx.order.create({
        data: {
          userId: params.userId,
          laboratoryId: labTest.laboratoryId,
          drawCenterId: params.drawCenterId || null,
          orderNumber: buildOrderNumber(),
          currency: labTest.currency,
          subtotal,
          processingFee,
          total,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.PENDING_PAYMENT,
          accessSubmissionStatus: AccessSubmissionStatus.NOT_SUBMITTED,
          accessPayloadJson: toJson(params.accessPayloadJson || {}),
          customerEmailSnapshot:
            typeof patient.email === 'string' ? patient.email : null,
          customerPhoneSnapshot:
            typeof patient.phone === 'string' ? patient.phone : null,
          currentTrackingStep: orderStateMachine.getStep(OrderStatus.PENDING_PAYMENT),
          trackingUpdatedAt: new Date(),
          orderItems: {
            create: [
              {
                testId: labTest.testId,
                labTestId: labTest.id,
                labTestCode: labTest.labTestCode,
                testName: labTest.test.name,
                laboratoryName: labTest.laboratory.name,
                quantity: 1,
                baseRetailPrice: labTest.retailPrice,
                effectiveUnitPrice: labTest.salePrice ?? labTest.retailPrice,
                discountAmount: 0,
                price: labTest.salePrice ?? labTest.retailPrice,
                labCost: labTest.labCost,
                currency: labTest.currency,
              },
            ],
          },
        },
      });

      await orderTrackingService.track(
        {
          orderId: order.id,
          eventType: 'ORDER_CREATED',
          previousStatus: null,
          nextStatus: OrderStatus.PENDING_PAYMENT,
          actorType: params.userId ? 'CUSTOMER' : 'SYSTEM',
          actorId: params.userId,
          message: 'Order created and awaiting payment',
        },
        tx,
      );

      return order.id;
    });

    await this.emitTrackingUpdate(createdOrderId);
    await this.notifyOrder(createdOrderId, 'ORDER_CREATED');
    return this.getOrderById(createdOrderId);
  }

  async markOrderPaymentProcessing(params: MarkOrderPaidParams) {
    const order = await this.repository.findById(params.orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    await prisma.order.update({
      where: { id: params.orderId },
      data: {
        paymentStatus: PaymentStatus.PROCESSING,
        stripePaymentIntentId: params.stripePaymentIntentId,
        paymentMethodType: params.paymentMethodType || undefined,
      },
    });

    await orderTrackingService.track({
      orderId: params.orderId,
      eventType: 'PAYMENT_INTENT_CREATED',
      previousStatus: order.orderStatus,
      nextStatus: order.orderStatus,
      actorType: 'WEBHOOK',
      message: 'Payment is processing',
    });

    await this.emitTrackingUpdate(params.orderId);
    return this.getOrderById(params.orderId);
  }

  async markOrderPaid(params: MarkOrderPaidParams) {
    const order = await this.repository.findById(params.orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.orderStatus === OrderStatus.AWAITING_USER_CONFIRMATION) {
      return this.getOrderById(order.id);
    }

    if (
      order.orderStatus !== OrderStatus.PENDING_PAYMENT &&
      order.orderStatus !== OrderStatus.PAYMENT_FAILED
    ) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Order cannot be marked paid from status ${order.orderStatus}`,
      );
    }

    await this.transitionOrderStatus(order.id, OrderStatus.AWAITING_USER_CONFIRMATION, {
      actorType: 'WEBHOOK',
      actorId: params.lastPaymentEventId || null,
      eventType: 'PAYMENT_SUCCEEDED',
      message: 'Payment succeeded and order is awaiting user confirmation',
      updateData: {
        paymentStatus: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: params.stripePaymentIntentId,
        paymentMethodType: params.paymentMethodType || undefined,
        paymentSnapshotJson: toNullableJsonValue(params.paymentSnapshotJson),
        lastPaymentEventId: params.lastPaymentEventId || null,
        paidAt: new Date(),
        manualReviewRequired: false,
      },
    });

    await auditLogService.record({
      action: 'ORDER_PAYMENT_SUCCEEDED',
      resource: 'order',
      resourceId: order.id,
      details: {
        stripePaymentIntentId: params.stripePaymentIntentId,
      },
    });

    await this.emitTrackingUpdate(order.id);
    await this.notifyOrder(order.id, 'PAYMENT_SUCCEEDED');
    return this.getOrderById(order.id);
  }

  async markOrderFailed(orderId: string, reason = 'Payment failed') {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.orderStatus === OrderStatus.PAYMENT_FAILED) {
      return this.getOrderById(orderId);
    }

    await this.transitionOrderStatus(orderId, OrderStatus.PAYMENT_FAILED, {
      actorType: 'WEBHOOK',
      eventType: 'PAYMENT_FAILED',
      message: reason,
      updateData: {
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    await this.emitTrackingUpdate(orderId);
    await this.notifyOrder(orderId, 'PAYMENT_FAILED', { reason });
    return this.getOrderById(orderId);
  }

  async markManualReviewRequired(orderId: string, metadata?: Record<string, unknown>) {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    const nextStatus =
      order.orderStatus === OrderStatus.MANUAL_REVIEW_REQUIRED
        ? OrderStatus.MANUAL_REVIEW_REQUIRED
        : OrderStatus.MANUAL_REVIEW_REQUIRED;

    if (order.orderStatus !== OrderStatus.MANUAL_REVIEW_REQUIRED) {
      await this.transitionOrderStatus(orderId, nextStatus, {
        actorType: 'SYSTEM',
        eventType: 'SUPPORT_TICKET_CREATED',
        message: 'Order moved to manual review',
        metadata,
        updateData: {
          manualReviewRequired: true,
        },
      });

      await this.notifyOrder(orderId, 'MANUAL_REVIEW_REQUIRED', {
        reason:
          typeof metadata?.reason === 'string'
            ? metadata.reason
            : 'This order requires manual review',
      });

      await this.emitManualReviewQueueUpdate(orderId);
    }

    return this.getOrderById(orderId);
  }

  async markOrderDisputed(orderId: string, metadata?: Record<string, unknown>) {
    return this.markManualReviewRequired(orderId, metadata);
  }

  async confirmOrderByUser(orderId: string, actorId?: string) {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.orderStatus === OrderStatus.READY_FOR_LAB_SUBMISSION) {
      return this.getOrderById(orderId);
    }

    if (order.paymentStatus !== PaymentStatus.SUCCEEDED) {
      throw new ApiError(httpStatus.CONFLICT, 'Order payment is not successful yet');
    }

    await this.transitionOrderStatus(orderId, OrderStatus.READY_FOR_LAB_SUBMISSION, {
      actorType: 'CUSTOMER',
      actorId: actorId || null,
      eventType: 'USER_CONFIRMED_ORDER',
      message: 'Customer confirmed the paid order for lab submission',
      updateData: {
        userConfirmedAt: new Date(),
        placedAt: new Date(),
      },
    });

    await this.emitTrackingUpdate(orderId);
    await this.notifyOrder(orderId, 'ORDER_CONFIRMED', {
      appointmentDate: 'your selected lab visit',
    });
    return this.getOrderById(orderId);
  }

  async beginLabSubmission(orderId: string, actorType: TrackingActorType = 'WORKER') {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.orderStatus === OrderStatus.LAB_SUBMISSION_IN_PROGRESS) {
      return this.getOrderById(orderId);
    }

    await this.transitionOrderStatus(orderId, OrderStatus.LAB_SUBMISSION_IN_PROGRESS, {
      actorType,
      eventType: 'LAB_SUBMISSION_STARTED',
      message: 'Lab submission started',
      updateData: {
        accessSubmissionStatus: AccessSubmissionStatus.PENDING,
        labSubmissionAttempts: {
          increment: 1,
        },
        lastLabSubmissionAttemptAt: new Date(),
      },
    });

    await this.emitTrackingUpdate(orderId);
    await this.notifyOrder(orderId, 'ORDER_IN_PROGRESS');
    return this.getOrderById(orderId);
  }

  async markLabOrderPlaced(params: MarkLabOrderPlacedParams) {
    const order = await this.repository.findById(params.orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    const updated = await this.transitionOrderStatus(params.orderId, OrderStatus.REQUISITION_READY, {
      actorType: 'WORKER',
      eventType: 'LAB_SUBMISSION_SUCCEEDED',
      message: 'Lab submission succeeded and requisition is ready',
      updateData: {
        accessSubmissionStatus: AccessSubmissionStatus.SUBMITTED,
        accessOrderId: params.accessOrderId || null,
        requisitionPdfUrl: params.requisitionPdfUrl || null,
        requisitionPdfPath: params.requisitionPdfPath || null,
        labVisitInstructions: params.labVisitInstructions || null,
        labSubmissionPayloadJson: toNullableJsonValue(params.rawPayload),
        labSubmissionResponseJson: toNullableJsonValue(params.rawResponse),
        accessResponseJson: toNullableJsonValue(params.rawResponse),
        submittedToLabAt: new Date(),
        labOrderPlacedAt: new Date(),
      },
    });

    await requisitionsService.create({
      orderId: updated.id,
      orderItemId: updated.orderItems[0]?.id || null,
      laboratoryId: updated.laboratoryId,
      providerCode: updated.laboratory.code,
      requisitionNumber: params.accessOrderId || null,
      requisitionPdfUrl: params.requisitionPdfUrl || null,
      requisitionPdfPath: params.requisitionPdfPath || null,
      labOrderId: params.accessOrderId || null,
      drawCenterSnapshotJson: (
        params.confirmedLabLocation ||
        (updated.drawCenter
          ? {
              id: updated.drawCenter.id,
              name: updated.drawCenter.name,
              addressLine1: updated.drawCenter.addressLine1,
              city: updated.drawCenter.city,
              state: updated.drawCenter.state,
              zipCode: updated.drawCenter.zipCode,
            }
          : null)
      ) as Prisma.InputJsonValue | null,
      rawPayloadJson: (params.rawPayload || null) as Prisma.InputJsonValue | null,
      rawResponseJson: (params.rawResponse || null) as Prisma.InputJsonValue | null,
      status: 'READY',
    });

    await orderTrackingService.track({
      orderId: updated.id,
      eventType: 'REQUISITION_CREATED',
      previousStatus: OrderStatus.REQUISITION_READY,
      nextStatus: OrderStatus.REQUISITION_READY,
      actorType: 'WORKER',
      message: 'Requisition stored for download',
    });

    await this.emitTrackingUpdate(updated.id);
    await this.notifyOrder(updated.id, 'REQUISITION_READY');
    return this.getOrderById(updated.id);
  }

  async markLabSubmissionFailed(
    orderId: string,
    payload: {
      errorMessage?: string;
      errorCode?: string | null;
      rawPayload?: Prisma.InputJsonValue | null;
      rawResponse?: Prisma.InputJsonValue | null;
    },
  ) {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    await this.transitionOrderStatus(orderId, OrderStatus.LAB_SUBMISSION_FAILED, {
      actorType: 'WORKER',
      eventType: 'LAB_SUBMISSION_FAILED',
      message: payload.errorMessage || 'Lab submission failed',
      metadata: {
        errorCode: payload.errorCode || null,
      },
      updateData: {
        accessSubmissionStatus: AccessSubmissionStatus.FAILED,
        labSubmissionErrorCode: payload.errorCode || null,
        labSubmissionErrorMessage: payload.errorMessage || null,
        accessErrorMessage: payload.errorMessage || null,
        labSubmissionPayloadJson: toNullableJsonValue(payload.rawPayload),
        labSubmissionResponseJson: toNullableJsonValue(payload.rawResponse),
      },
    });

    await this.emitTrackingUpdate(orderId);
    await this.emitManualReviewQueueUpdate(orderId);
    await this.notifyOrder(orderId, 'LAB_SUBMISSION_FAILED', {
      reason: payload.errorMessage || 'Lab submission failed',
    });
    return this.getOrderById(orderId);
  }

  async requestManualReview(orderId: string, userId: string, note?: string) {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.userId !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    if (order.orderStatus !== OrderStatus.LAB_SUBMISSION_FAILED) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Manual review can only be requested after a lab submission failure',
      );
    }

    await this.transitionOrderStatus(orderId, OrderStatus.MANUAL_REVIEW_REQUIRED, {
      actorType: 'CUSTOMER',
      actorId: userId,
      eventType: 'SUPPORT_TICKET_CREATED',
      message: 'Customer requested manual review',
      metadata: {
        note: note || null,
      },
      updateData: {
        manualReviewRequired: true,
      },
    });

    await this.emitTrackingUpdate(orderId);
    await this.emitManualReviewQueueUpdate(orderId);
    await this.notifyOrder(orderId, 'MANUAL_REVIEW_REQUIRED', {
      reason: note || 'Customer requested manual review',
    });
    return this.getOrderById(orderId);
  }

  async adminResendSubmission(orderId: string, actorId?: string) {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (
      order.orderStatus !== OrderStatus.LAB_SUBMISSION_FAILED &&
      order.orderStatus !== OrderStatus.MANUAL_REVIEW_REQUIRED
    ) {
      throw new ApiError(httpStatus.CONFLICT, 'Order is not eligible for manual resend');
    }

    await this.transitionOrderStatus(orderId, OrderStatus.READY_FOR_LAB_SUBMISSION, {
      actorType: 'ADMIN',
      actorId: actorId || null,
      eventType: 'ADMIN_RESEND_TRIGGERED',
      message: 'Admin re-queued lab submission',
      updateData: {
        manualReviewRequired: false,
        accessSubmissionStatus: AccessSubmissionStatus.NOT_SUBMITTED,
        labSubmissionErrorCode: null,
        labSubmissionErrorMessage: null,
        accessErrorMessage: null,
      },
    });

    await this.emitTrackingUpdate(orderId);
    await this.emitManualReviewQueueUpdate(orderId);
    return this.getOrderById(orderId);
  }

  async prepareOrderForAccessRetry(orderId: string) {
    return this.adminResendSubmission(orderId);
  }

  async resolveManualReview(orderId: string) {
    return this.adminResendSubmission(orderId);
  }

  async markAccessPlacementNeedsReview(orderId: string) {
    return this.markLabSubmissionFailed(orderId, {
      errorMessage: 'Lab submission failed after retries and is awaiting customer/manual review',
      errorCode: 'LAB_RETRY_EXHAUSTED',
    });
  }

  async getOrderById(orderId: string) {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    return {
      ...toOrderSummary(order),
      accessPayloadJson: order.accessPayloadJson,
      accessResponseJson: order.accessResponseJson,
      drawCenter: order.drawCenter,
      laboratory: order.laboratory,
      orderItems: order.orderItems.map((item) => ({
        ...item,
        price: Number(item.price),
        baseRetailPrice: Number(item.baseRetailPrice),
        effectiveUnitPrice: Number(item.effectiveUnitPrice),
        discountAmount: Number(item.discountAmount),
        labCost: Number(item.labCost),
      })),
      patient: order.patient,
      requisitions: order.requisitions,
      promoCodes: order.promoCodes.map((promo) => ({
        id: promo.id,
        appliedCode: promo.appliedCode,
        discountAmount: Number(promo.discountAmount),
        promoCodeId: promo.promoCodeId,
      })),
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      processingFee: Number(order.processingFee),
      discount: Number(order.discount),
      tax: Number(order.tax),
    };
  }

  async getOrderByPaymentIntentId(paymentIntentId: string) {
    const order = await this.repository.findByPaymentIntentId(paymentIntentId);
    return order ? this.getOrderById(order.id) : null;
  }

  async getOrdersByUserId(userId: string) {
    const orders = await this.repository.listByUserId(userId);
    return orders.map((order) => toOrderSummary(order));
  }

  async getManualReviewOrders(limit = 100) {
    const orders = await this.repository.listManualReview(limit);
    return orders.map((order) => ({
      ...toOrderSummary(order),
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    }));
  }

  async getLatestResumableOrderForUser(userId: string) {
    const order = await this.repository.findLatestResumableByUserId(userId);
    return order ? this.getOrderById(order.id) : null;
  }

  async getAllOrders(params: { page: number; limit: number }) {
    const orders = await this.repository.listAll(params.page, params.limit);
    return orders.map((order) => ({
      ...toOrderSummary(order),
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      drawCenter: order.drawCenter
        ? {
            id: order.drawCenter.id,
            name: order.drawCenter.name,
            address: [
              order.drawCenter.addressLine1,
              order.drawCenter.addressLine2,
              order.drawCenter.city,
              order.drawCenter.state,
              order.drawCenter.zipCode,
            ]
              .filter(Boolean)
              .join(', '),
          }
        : null,
    }));
  }

  async getTrackingEvents(orderId: string) {
    return orderTrackingService.list(orderId);
  }

  async getOrderWithTrackingStatus(orderId: string) {
    const order = await this.getOrderById(orderId);
    const steps = [
      {
        step: 1,
        label: 'Order Created',
        completed: true,
        completedAt: order.createdAt,
      },
      {
        step: 2,
        label: 'Payment Completed',
        completed: ['AWAITING_USER_CONFIRMATION', 'READY_FOR_LAB_SUBMISSION', 'LAB_SUBMISSION_IN_PROGRESS', 'LAB_SUBMISSION_FAILED', 'MANUAL_REVIEW_REQUIRED', 'SUBMITTED_TO_LAB', 'REQUISITION_READY', 'COMPLETED'].includes(order.orderStatus),
        completedAt: order.paidAt,
      },
      {
        step: 3,
        label: 'User Confirmed',
        completed: ['READY_FOR_LAB_SUBMISSION', 'LAB_SUBMISSION_IN_PROGRESS', 'LAB_SUBMISSION_FAILED', 'MANUAL_REVIEW_REQUIRED', 'SUBMITTED_TO_LAB', 'REQUISITION_READY', 'COMPLETED'].includes(order.orderStatus),
        completedAt: order.userConfirmedAt,
      },
      {
        step: 4,
        label: 'Submitted To Lab',
        completed: ['SUBMITTED_TO_LAB', 'REQUISITION_READY', 'COMPLETED'].includes(order.orderStatus),
        completedAt: order.submittedToLabAt,
      },
      {
        step: 5,
        label: 'Requisition Ready',
        completed: ['REQUISITION_READY', 'COMPLETED'].includes(order.orderStatus),
        completedAt: order.labOrderPlacedAt,
      },
    ];

    return {
      orderId: order.id,
      status: order.orderStatus.toLowerCase(),
      paymentStatus: order.paymentStatus.toLowerCase(),
      currentStep: order.currentTrackingStep,
      steps,
      requisitionUrl: order.requisitionPdfUrl,
      lastUpdated: order.updatedAt,
    };
  }

  async getRequisitionDownloadUrl(params: {
    orderId: string;
    requesterUserId?: string;
    isAdmin: boolean;
  }) {
    const order = await this.repository.findById(params.orderId);
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (!params.isAdmin && order.userId !== params.requesterUserId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    const requisition =
      order.requisitions.find((item) => item.status === 'READY') ||
      order.requisitions[0] ||
      null;
    const url = requisition?.requisitionPdfUrl || order.requisitionPdfUrl;

    if (!url) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Requisition not available yet');
    }

    if (url.includes('amazonaws.com')) {
      const parsed = parseS3Url(url);
      if (parsed) {
        return signS3GetObject({
          bucket: parsed.bucket,
          key: parsed.key,
          expiresInSeconds: Number(env.REQUISITION_SIGNED_URL_TTL_SECONDS),
        });
      }
    }

    return url;
  }

  async recordTrackingEvent(
    orderId: string,
    step: number,
    _status: string,
    message?: string,
    metadata?: Record<string, any>,
  ) {
    return orderTrackingService.track({
      orderId,
      eventType: 'ORDER_CREATED',
      actorType: 'SYSTEM',
      message,
      metadata,
      nextStatus: undefined,
    });
  }

  async publishTrackingUpdate(orderId: string) {
    await this.emitTrackingUpdate(orderId);
  }

  async expireStaleOrders(cutoff: Date) {
    const orders = await this.repository.findStaleOrders(cutoff);

    for (const order of orders) {
      if (order.orderStatus === OrderStatus.CANCELLED || order.orderStatus === OrderStatus.COMPLETED) {
        continue;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });
    }

    return { expiredCount: orders.length };
  }
}

export const orderService = new OrderService();
