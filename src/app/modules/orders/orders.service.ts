import { OrderStatus, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../app/errors/ApiErrors';
import { env } from '../../../config/env';
import { getIO } from '../../../config/socket';
import { parseS3Url, signS3GetObject } from '../../../lib/s3Presign';
import prisma from '../../../shared/prisma';
import { socketManager } from '../../helpers/socketManager';
import { auditLogService } from '../../services/auditLog.service';

interface CreateOrderParams {
  userId: string | null;
  labTestId: string;
  accessPayloadJson: Record<string, any>;
}

interface MarkOrderPaidParams {
  orderId: string;
  stripePaymentIntentId: string;
}

interface MarkLabOrderPlacedParams {
  orderId: string;
  accessOrderId: string;
  requisitionPdfUrl?: string;
  labVisitInstructions?: string;
  accessCsv?: string;
  confirmedLabLocation?: Record<string, unknown>;
}

const hasManualReviewFieldError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('Unknown argument `manualReviewRequired`') ||
    error.message.includes('Unknown arg `manualReviewRequired`')
  );
};

const mergeAccessPayloadWithConfirmedLocation = (
  accessPayloadJson: unknown,
  confirmedLabLocation?: Record<string, unknown>,
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  if (!confirmedLabLocation || Object.keys(confirmedLabLocation).length === 0) {
    if (accessPayloadJson === null) return Prisma.JsonNull;
    if (
      accessPayloadJson &&
      typeof accessPayloadJson === 'object' &&
      !Array.isArray(accessPayloadJson)
    ) {
      return accessPayloadJson as Prisma.InputJsonValue;
    }

    return {} as Prisma.InputJsonValue;
  }

  const basePayload =
    accessPayloadJson && typeof accessPayloadJson === 'object' && !Array.isArray(accessPayloadJson)
      ? (accessPayloadJson as Record<string, unknown>)
      : {};

  return {
    ...basePayload,
    confirmedLabLocation,
  } as Prisma.InputJsonValue;
};

class OrderService {
  private async emitTrackingUpdate(orderId: string): Promise<void> {
    try {
      const trackingStatus = await this.getOrderWithTrackingStatus(orderId);
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true },
      });

      if (order?.userId) {
        socketManager.emitToUser(order.userId, 'order:tracking-update', trackingStatus);
      }

      const io = getIO();
      io.to(`order:${orderId}`).emit('order:tracking-update', trackingStatus);
    } catch (error) {
      console.error('[OrderService] Failed to emit tracking update:', error);
    }
  }

  async publishTrackingUpdate(orderId: string): Promise<void> {
    await this.emitTrackingUpdate(orderId);
  }

  /**
   * Create a new order in PENDING_PAYMENT status (tamper-proof totals).
   * Totals are computed server-side from the Test price + configured fees.
   */
  async createOrder(params: CreateOrderParams) {
    const { userId, labTestId, accessPayloadJson } = params;

    // Validate test exists
    const test = await prisma.test.findUnique({
      where: { id: labTestId },
      select: { id: true, testName: true, price: true, isActive: true, isPublished: true },
    });

    if (!test || !test.isActive || !test.isPublished) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Lab test not found');
    }

    const { subtotal, processingFee, total } = this.computeTotals(test.price);
    const order = await prisma.order.create({
      data: {
        userId,
        labTestId,
        status: OrderStatus.PENDING_PAYMENT,
        subtotal,
        processingFee,
        total,
        accessPayloadJson,
        stripePaymentIntentId: null,
        currentTrackingStep: 1,
      },
      include: {
        test: {
          select: { id: true, testName: true, price: true },
        },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    await this.recordTrackingEvent(order.id, 1, 'pending', 'Order created and awaiting payment');
    await this.emitTrackingUpdate(order.id);

    return order;
  }

  private computeTotals(basePrice: number) {
    // Fees are configurable via env; default 0 to keep backward compatible.
    // IMPORTANT: round to 2 decimals to match UI expectations.
    const percent = Number(process.env.PROCESSING_FEE_PERCENT || 0);
    const flat = Number(process.env.PROCESSING_FEE_FLAT || 0);

    const subtotal = this.round2(basePrice);
    const processingFee = this.round2((subtotal * percent) / 100 + flat);
    const total = this.round2(subtotal + processingFee);

    return { subtotal, processingFee, total };
  }

  private round2(value: number) {
    return Math.round(value * 100) / 100;
  }

  /**
   * Mark order as PAID (idempotent - only updates if in PENDING_PAYMENT status)
   */
  async markOrderPaid(params: MarkOrderPaidParams) {
    const { orderId, stripePaymentIntentId } = params;

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, stripePaymentIntentId: true },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    // Idempotent check - already paid with same payment intent
    if (
      order.status === OrderStatus.PAID &&
      order.stripePaymentIntentId === stripePaymentIntentId
    ) {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          test: { select: { id: true, testName: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    }

    // Allow transition from PENDING_PAYMENT or PAYMENT_PROCESSING (ACH) to PAID
    if (
      order.status !== OrderStatus.PENDING_PAYMENT &&
      order.status !== OrderStatus.PAYMENT_PROCESSING
    ) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Cannot mark order as paid. Current status: ${order.status}`,
      );
    }

    // Update to PAID
    let updatedOrder;
    try {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          stripePaymentIntentId,
          paidAt: new Date(),
          manualReviewRequired: false,
        },
        include: {
          test: { select: { id: true, testName: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    } catch (error) {
      if (!hasManualReviewFieldError(error)) throw error;

      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          stripePaymentIntentId,
          paidAt: new Date(),
        },
        include: {
          test: { select: { id: true, testName: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    }

    await this.recordTrackingEvent(orderId, 2, 'completed', 'Payment processed successfully', {
      stripePaymentIntentId,
    });
    await this.emitTrackingUpdate(orderId);

    await auditLogService.record({
      action: 'ORDER_PAYMENT_CONFIRMED',
      resource: 'order',
      resourceId: orderId,
      details: {
        status: updatedOrder.status,
        stripePaymentIntentId,
      },
    });

    return updatedOrder;
  }

  /**
   * Flag an order for manual review (e.g., amount mismatch, fraud signals).
   * Does not change PAID status by itself.
   */
  async markManualReviewRequired(orderId: string, context?: Record<string, unknown>) {
    let updated;
    try {
      updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          manualReviewRequired: true,
        },
      });
    } catch (error) {
      if (!hasManualReviewFieldError(error)) throw error;
      // Schema might not have manualReviewRequired in older DBs; ignore.
      updated = await prisma.order.findUnique({ where: { id: orderId } });
    }

    await this.recordTrackingEvent(
      orderId,
      2,
      'warning',
      'Order requires manual review before fulfillment',
      context || {},
    );
    await this.emitTrackingUpdate(orderId);

    await auditLogService.record({
      action: 'ORDER_MARKED_MANUAL_REVIEW',
      resource: 'order',
      resourceId: orderId,
      details: {
        context: context || {},
      },
    });

    return updated;
  }

  /**
   * Mark order as LAB_ORDER_PLACED (idempotent - only updates if in PAID status)
   */
  async markLabOrderPlaced(params: MarkLabOrderPlacedParams) {
    const {
      orderId,
      accessOrderId,
      requisitionPdfUrl,
      labVisitInstructions,
      accessCsv,
      confirmedLabLocation,
    } = params;

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, accessOrderId: true, accessPayloadJson: true },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    // Idempotent check - already placed with same ACCESS order ID
    if (order.status === OrderStatus.LAB_ORDER_PLACED && order.accessOrderId === accessOrderId) {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          test: { select: { id: true, testName: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    }

    // Only allow transition from PAID to LAB_ORDER_PLACED
    if (order.status !== OrderStatus.PAID) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Cannot mark lab order as placed. Current status: ${order.status}`,
      );
    }

    // Update to LAB_ORDER_PLACED
    let updatedOrder;
    const accessPayloadJson = mergeAccessPayloadWithConfirmedLocation(
      order.accessPayloadJson,
      confirmedLabLocation,
    );

    try {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.LAB_ORDER_PLACED,
          accessOrderId,
          requisitionPdfUrl,
          labVisitInstructions,
          manualReviewRequired: false,
          accessCsv,
          accessPayloadJson,
          labOrderPlacedAt: new Date(),
        },
        include: {
          test: { select: { id: true, testName: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    } catch (error) {
      if (!hasManualReviewFieldError(error)) throw error;

      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.LAB_ORDER_PLACED,
          accessOrderId,
          requisitionPdfUrl,
          labVisitInstructions,
          accessCsv,
          accessPayloadJson,
          labOrderPlacedAt: new Date(),
        },
        include: {
          test: { select: { id: true, testName: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    }

    await this.recordTrackingEvent(orderId, 3, 'completed', 'Lab order submitted successfully', {
      accessOrderId,
      requisitionPdfUrl,
      confirmedLabLocation,
    });
    await this.emitTrackingUpdate(orderId);

    await auditLogService.record({
      action: 'ORDER_LAB_SUBMITTED',
      resource: 'order',
      resourceId: orderId,
      details: {
        status: updatedOrder.status,
        accessOrderId,
        hasRequisitionUrl: Boolean(requisitionPdfUrl),
      },
    });

    return updatedOrder;
  }

  /**
   * Mark order as COMPLETED
   */
  async markOrderCompleted(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.status !== OrderStatus.LAB_ORDER_PLACED) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Cannot mark order as completed. Current status: ${order.status}`,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COMPLETED,
      },
      include: {
        test: { select: { id: true, testName: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await this.recordTrackingEvent(orderId, 4, 'completed', 'Results are ready');
    await this.emitTrackingUpdate(orderId);

    return updatedOrder;
  }

  /**
   * Mark order as PAYMENT_PROCESSING (ACH payments in transit).
   * ACH Direct Debit is a delayed-notification method; funds are not
   * immediately available. This status indicates the bank transfer has
   * been initiated but not yet cleared.
   */
  async markOrderPaymentProcessing(params: { orderId: string; stripePaymentIntentId: string }) {
    const { orderId, stripePaymentIntentId } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, stripePaymentIntentId: true },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    // Idempotent: already in PAYMENT_PROCESSING with same PI
    if (
      order.status === OrderStatus.PAYMENT_PROCESSING &&
      order.stripePaymentIntentId === stripePaymentIntentId
    ) {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          test: { select: { id: true, testName: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    }

    // Only allow transition from PENDING_PAYMENT
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Cannot mark order as payment processing. Current status: ${order.status}`,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAYMENT_PROCESSING,
        stripePaymentIntentId,
      },
      include: {
        test: { select: { id: true, testName: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await this.recordTrackingEvent(
      orderId,
      2,
      'processing',
      'ACH bank transfer initiated — awaiting clearance (typically 2-5 business days)',
      { stripePaymentIntentId },
    );
    await this.emitTrackingUpdate(orderId);

    await auditLogService.record({
      action: 'ORDER_PAYMENT_PROCESSING',
      resource: 'order',
      resourceId: orderId,
      details: {
        status: updatedOrder.status,
        stripePaymentIntentId,
        paymentMethod: 'ach_direct_debit',
      },
    });

    return updatedOrder;
  }

  /**
   * Handle ACH dispute (charge-back / return).
   * Marks order for manual review and records the dispute details.
   */
  async markOrderDisputed(orderId: string, disputeDetails: Record<string, unknown>) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    // For disputes, flag manual review regardless of current status
    let updated;
    try {
      updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          manualReviewRequired: true,
        },
      });
    } catch (error) {
      if (!hasManualReviewFieldError(error)) throw error;
      updated = await prisma.order.findUnique({ where: { id: orderId } });
    }

    await this.recordTrackingEvent(
      orderId,
      0,
      'warning',
      'ACH payment disputed — funds may be reversed. Manual review required.',
      disputeDetails,
    );
    await this.emitTrackingUpdate(orderId);

    await auditLogService.record({
      action: 'ORDER_ACH_DISPUTE_CREATED',
      resource: 'order',
      resourceId: orderId,
      details: disputeDetails,
    });

    return updated;
  }

  /**
   * Mark order as FAILED (for payment or lab order failures)
   */
  async markOrderFailed(orderId: string) {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.FAILED,
      },
      include: {
        test: { select: { id: true, testName: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await this.recordTrackingEvent(orderId, 0, 'failed', 'Order processing failed');
    await this.emitTrackingUpdate(orderId);

    await auditLogService.record({
      action: 'ORDER_MARKED_FAILED',
      resource: 'order',
      resourceId: orderId,
      details: {
        status: updatedOrder.status,
      },
    });

    return updatedOrder;
  }

  /**
   * Keep paid order safe when ACCESS placement fails after retries.
   * Do not move to FAILED because payment already succeeded.
   */
  async markAccessPlacementNeedsReview(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paidAt: true },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.status === OrderStatus.PAID) {
      try {
        const updated = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PAID,
            paidAt: order.paidAt || new Date(),
            manualReviewRequired: true,
            labVisitInstructions:
              'Payment received successfully. Lab order is delayed due to a temporary partner issue and has been queued for manual review.',
          },
          include: {
            test: { select: { id: true, testName: true, price: true } },
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        });

        await this.recordTrackingEvent(
          orderId,
          2,
          'needs_review',
          'Payment received; lab placement moved to manual review',
        );
        await this.emitTrackingUpdate(orderId);

        await auditLogService.record({
          action: 'ORDER_ACCESS_RETRY_MANUAL_REVIEW',
          resource: 'order',
          resourceId: orderId,
          details: {
            status: updated.status,
          },
        });

        return updated;
      } catch (error) {
        if (!hasManualReviewFieldError(error)) throw error;

        const updated = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PAID,
            paidAt: order.paidAt || new Date(),
            labVisitInstructions:
              'Payment received successfully. Lab order is delayed due to a temporary partner issue and has been queued for manual review.',
          },
          include: {
            test: { select: { id: true, testName: true, price: true } },
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        });

        await this.recordTrackingEvent(
          orderId,
          2,
          'needs_review',
          'Payment received; lab placement moved to manual review',
        );
        await this.emitTrackingUpdate(orderId);

        await auditLogService.record({
          action: 'ORDER_ACCESS_RETRY_MANUAL_REVIEW',
          resource: 'order',
          resourceId: orderId,
          details: {
            status: updated.status,
          },
        });

        return updated;
      }
    }

    if (order.status === OrderStatus.LAB_ORDER_PLACED || order.status === OrderStatus.COMPLETED) {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          test: { select: { id: true, testName: true, price: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    }

    throw new ApiError(
      httpStatus.CONFLICT,
      `Cannot mark ACCESS placement for manual review from status: ${order.status}`,
    );
  }

  /**
   * Prepare an order for ACCESS lab retry.
   * Allowed statuses:
   * - PAID: ready as-is
   * - FAILED: restored to PAID for retry
   */
  async prepareOrderForAccessRetry(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        test: { select: { id: true, testName: true, price: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.status === OrderStatus.PAID) {
      return order;
    }

    if (order.status === OrderStatus.FAILED) {
      try {
        const updated = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PAID,
            paidAt: order.paidAt || new Date(),
            manualReviewRequired: false,
          },
          include: {
            test: { select: { id: true, testName: true, price: true } },
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        });

        await this.recordTrackingEvent(orderId, 2, 'processing', 'Retry queued for lab placement');
        await this.emitTrackingUpdate(orderId);

        return updated;
      } catch (error) {
        if (!hasManualReviewFieldError(error)) throw error;

        const updated = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PAID,
            paidAt: order.paidAt || new Date(),
          },
          include: {
            test: { select: { id: true, testName: true, price: true } },
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        });

        await this.recordTrackingEvent(orderId, 2, 'processing', 'Retry queued for lab placement');
        await this.emitTrackingUpdate(orderId);

        return updated;
      }
    }

    throw new ApiError(
      httpStatus.CONFLICT,
      `Cannot retry ACCESS placement for order in status: ${order.status}`,
    );
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        test: true,
        items: {
          include: {
            test: { select: { id: true, testName: true, price: true } },
            panel: { select: { id: true, name: true, basePrice: true, discountPercent: true } },
          },
        },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true },
        },
      },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    return order;
  }

  /**
   * Get orders by user ID
   */
  async getOrdersByUserId(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        test: { select: { id: true, testName: true, price: true } },
        items: {
          include: {
            test: { select: { id: true, testName: true, price: true } },
            panel: { select: { id: true, name: true, basePrice: true, discountPercent: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  /**
   * Get orders that require manual review (admin/ops queue)
   */
  async getManualReviewOrders(limit = 100) {
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, limit)) : 100;

    let orders;
    try {
      orders = await prisma.order.findMany({
        where: {
          manualReviewRequired: true,
        },
        include: {
          test: { select: { id: true, testName: true, price: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: safeLimit,
      });
    } catch (error) {
      if (!hasManualReviewFieldError(error)) throw error;

      orders = await prisma.order.findMany({
        where: {
          status: OrderStatus.PAID,
          labVisitInstructions: {
            contains: 'manual review',
            mode: 'insensitive',
          },
        },
        include: {
          test: { select: { id: true, testName: true, price: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: safeLimit,
      });
    }

    return orders;
  }

  async resolveManualReview(orderId: string, metadata?: Record<string, unknown>) {
    let order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.status === OrderStatus.FAILED) {
      const recovered = await this.prepareOrderForAccessRetry(orderId);
      order = { id: recovered.id, status: recovered.status };
    } else if (order.status !== OrderStatus.PAID) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Only PAID or FAILED orders can be manually approved. Current status: ${order.status}`,
      );
    }

    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          manualReviewRequired: false,
        },
      });
    } catch (error) {
      if (!hasManualReviewFieldError(error)) throw error;
    }

    await this.recordTrackingEvent(
      orderId,
      2,
      'processing',
      'Manual review approved by operations. Lab placement retry queued.',
      metadata || {},
    );
    await this.emitTrackingUpdate(orderId);

    return await this.getOrderById(orderId);
  }

  /**
   * Get latest order that can be resumed in checkout flow.
   */
  async getLatestResumableOrderForUser(userId: string) {
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: {
          in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID, OrderStatus.LAB_ORDER_PLACED],
        },
      },
      include: {
        test: { select: { id: true, testName: true, price: true } },
        items: {
          include: {
            test: { select: { id: true, testName: true, price: true } },
            panel: { select: { id: true, name: true, basePrice: true, discountPercent: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return order;
  }

  /**
   * Get order by Stripe payment intent ID
   */
  async getOrderByPaymentIntentId(paymentIntentId: string) {
    const order = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        test: true,
        items: {
          include: {
            test: { select: { id: true, testName: true, price: true } },
            panel: { select: { id: true, name: true, basePrice: true, discountPercent: true } },
          },
        },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    return order; // May return null if not found
  }

  /**
   * Record a tracking event for an order
   */
  async recordTrackingEvent(
    orderId: string,
    step: number,
    status: string,
    message?: string,
    metadata?: Record<string, any>,
  ) {
    // Update tracking on order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        currentTrackingStep: step,
        trackingUpdatedAt: new Date(),
      },
    });

    // Create tracking event
    const event = await prisma.orderTrackingEvent.create({
      data: {
        orderId,
        step,
        status,
        message,
        metadata,
      },
    });

    return event;
  }

  /**
   * Get tracking events for an order
   */
  async getTrackingEvents(orderId: string) {
    const events = await prisma.orderTrackingEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return events;
  }

  /**
   * Get order with tracking status formatted for frontend
   */
  async getOrderWithTrackingStatus(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        test: { select: { id: true, testName: true } },
        items: {
          include: {
            test: { select: { id: true, testName: true } },
            panel: { select: { id: true, name: true } },
          },
        },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        labCenter: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            hours: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    // Map status to step format
    const stepMapping: Record<string, number> = {
      PENDING_PAYMENT: 1,
      PAID: 2,
      LAB_ORDER_PLACED: 3,
      COMPLETED: 4,
      FAILED: 0,
    };

    const currentStep = stepMapping[order.status] || order.currentTrackingStep;
    const steps = [
      {
        step: 1,
        label: 'Order Placed',
        completed: currentStep >= 1,
        completedAt: order.createdAt,
      },
      {
        step: 2,
        label: 'Payment Processed',
        completed: currentStep >= 2,
        completedAt: order.paidAt,
      },
      {
        step: 3,
        label: 'Lab Order Submitted',
        completed: currentStep >= 3,
        completedAt: order.labOrderPlacedAt,
      },
      {
        step: 4,
        label: 'Results Ready',
        completed: currentStep >= 4,
        completedAt: null,
      },
    ];

    return {
      orderId: order.id,
      status: order.status.toLowerCase().replace(/_/g, '_'),
      currentStep,
      steps,
      items: order.items?.map((it) => ({
        type: it.type,
        quantity: it.quantity,
        test: it.test ? { id: it.test.id, name: it.test.testName } : null,
        panel: it.panel ? { id: it.panel.id, name: it.panel.name } : null,
      })),
      labLocation: order.labCenter
        ? {
            name: order.labCenter.name,
            address: order.labCenter.address,
            phone: order.labCenter.phone,
            hours: order.labCenter.hours,
            lat: order.labCenter.latitude,
            lng: order.labCenter.longitude,
          }
        : null,
      requisitionUrl: order.requisitionPdfUrl,
      estimatedResultsDate: null, // Will be calculated based on turnaround
      lastUpdated: order.trackingUpdatedAt || order.updatedAt,
    };
  }

  /**
   * Returns a secure requisition download URL.
   * - Always auth-gated by this endpoint.
   * - If requisitionPdfUrl points to S3, returns a short-lived signed URL.
   */
  async getRequisitionDownloadUrl(params: {
    orderId: string;
    requesterUserId?: string;
    isAdmin: boolean;
  }) {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      select: { id: true, userId: true, requisitionPdfUrl: true },
    });
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');

    if (!params.isAdmin && order.userId !== params.requesterUserId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    if (!order.requisitionPdfUrl) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Requisition not available yet');
    }

    const url = order.requisitionPdfUrl;

    // If stored on S3, return signed URL (default 5 minutes)
    if (url.includes('amazonaws.com')) {
      const parsed = parseS3Url(url);
      if (parsed) {
        return await signS3GetObject({
          bucket: parsed.bucket,
          key: parsed.key,
          expiresInSeconds: Number(env.REQUISITION_SIGNED_URL_TTL_SECONDS),
        });
      }
    }

    // Fallback: return stored URL (still protected by this endpoint)
    return url;
  }

  /**
   * Admin function to get all orders with pagination
   */
  async getAllOrders(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const orders = await prisma.order.findMany({
      skip,
      take: limit,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        labCenter: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            hours: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    return orders;
  }
}

export const orderService = new OrderService();
