import { CheckoutStatus, OrderItemType, OrderStatus } from '@prisma/client';
import httpStatus from 'http-status';
import { env } from '../../../config/env';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiErrors';
import { paymentService } from '../payment/payment.service';

type CheckoutItemInput = { type: 'TEST' | 'PANEL'; id: string; quantity: number };
type AccessPayload = {
  testCode?: string;
  testCodes?: string[];
  collectionType?: string;
  patient?: Record<string, unknown>;
  physicianNumber?: string;
  collectionDate?: string;
  collectionTime?: string;
  orderComment?: string;
  source?: string;
  docchart?: string;
  orderNumber?: string;
};

export class CheckoutService {
  private round2(n: number) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  private computeProcessingFee(subtotal: number) {
    const percent = Number(env.PROCESSING_FEE_PERCENT || 0);
    const flat = Number(env.PROCESSING_FEE_FLAT || 0);
    return this.round2((subtotal * percent) / 100 + flat);
  }

  private async priceItems(items: CheckoutItemInput[]) {
    const tests = items.filter((i) => i.type === 'TEST');
    const panels = items.filter((i) => i.type === 'PANEL');

    const [testRows, panelRows] = await Promise.all([
      prisma.test.findMany({
        where: { id: { in: tests.map((t) => t.id) }, isActive: true, isPublished: true },
        select: { id: true, testName: true, price: true },
      }),
      prisma.testPanel.findMany({
        where: { id: { in: panels.map((p) => p.id) }, isActive: true },
        select: { id: true, name: true, basePrice: true, discountPercent: true },
      }),
    ]);

    const testMap = new Map(testRows.map((t) => [t.id, t]));
    const panelMap = new Map(panelRows.map((p) => [p.id, p]));

    const priced = items.map((item) => {
      if (item.type === 'TEST') {
        const t = testMap.get(item.id);
        if (!t) throw new ApiError(httpStatus.NOT_FOUND, `Test not found: ${item.id}`);
        return {
          type: 'TEST' as const,
          id: item.id,
          name: t.testName,
          quantity: item.quantity,
          unitPrice: this.round2(t.price),
        };
      }

      const p = panelMap.get(item.id);
      if (!p) throw new ApiError(httpStatus.NOT_FOUND, `Panel not found: ${item.id}`);
      const discounted = this.round2(p.basePrice * (1 - (p.discountPercent || 0) / 100));
      return {
        type: 'PANEL' as const,
        id: item.id,
        name: p.name,
        quantity: item.quantity,
        unitPrice: discounted,
      };
    });

    const subtotal = this.round2(priced.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0));
    const processingFee = this.computeProcessingFee(subtotal);
    const total = this.round2(subtotal + processingFee);

    return { priced, subtotal, processingFee, total };
  }

  private uniqueStrings(values: string[]) {
    return Array.from(new Set(values.filter((v) => typeof v === 'string' && v.trim().length > 0)));
  }

  private getPatientFromSession(patientJson: unknown): Record<string, unknown> {
    if (!patientJson || typeof patientJson !== 'object' || Array.isArray(patientJson)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Checkout session patient data is invalid');
    }

    return patientJson as Record<string, unknown>;
  }

  private async buildDerivedAccessPayload(
    sessionPatientJson: unknown,
    itemsInput: CheckoutItemInput[],
  ): Promise<AccessPayload> {
    const patient = this.getPatientFromSession(sessionPatientJson);
    const testIds = itemsInput.filter((i) => i.type === 'TEST').map((i) => i.id);
    const panelIds = itemsInput.filter((i) => i.type === 'PANEL').map((i) => i.id);

    const [tests, panelTests] = await Promise.all([
      testIds.length
        ? prisma.test.findMany({
            where: { id: { in: testIds } },
            select: { testCode: true },
          })
        : Promise.resolve([]),
      panelIds.length
        ? prisma.panelTest.findMany({
            where: { panelId: { in: panelIds } },
            select: { test: { select: { testCode: true } } },
          })
        : Promise.resolve([]),
    ]);

    const testCodes = this.uniqueStrings([
      ...tests.map((t) => t.testCode),
      ...panelTests.map((pt) => pt.test?.testCode || ''),
    ]);

    if (!testCodes.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Unable to derive ACCESS test codes from selected checkout items',
      );
    }

    return {
      patient,
      collectionType: 'PSC',
      testCode: testCodes[0],
      testCodes,
    };
  }

  private mergeAccessPayload(input: unknown, derived: AccessPayload): AccessPayload {
    if (!input) return derived;

    if (typeof input !== 'object' || Array.isArray(input)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'accessPayloadJson must be an object');
    }

    const supplied = input as AccessPayload;
    const suppliedCodes = this.uniqueStrings([
      supplied.testCode || '',
      ...(Array.isArray(supplied.testCodes) ? supplied.testCodes : []),
    ]);
    const finalCodes = suppliedCodes.length ? suppliedCodes : derived.testCodes || [];

    if (!finalCodes.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'No ACCESS test code(s) available for order submission',
      );
    }

    const suppliedPatient =
      supplied.patient && typeof supplied.patient === 'object' && !Array.isArray(supplied.patient)
        ? supplied.patient
        : undefined;

    return {
      ...derived,
      ...supplied,
      patient: suppliedPatient || derived.patient,
      collectionType: supplied.collectionType || derived.collectionType || 'PSC',
      testCode: supplied.testCode || finalCodes[0],
      testCodes: finalCodes,
    };
  }

  async createSession(params: {
    userId: string;
    patient: any;
    items: CheckoutItemInput[];
    accessPayloadJson?: any;
  }) {
    const { userId, patient, items } = params;

    const { priced, subtotal, processingFee, total } = await this.priceItems(items);

    const ttlMs = Number(env.CHECKOUT_SESSION_TTL_MIN) * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);

    const session = await prisma.checkoutSession.create({
      data: {
        userId,
        status: CheckoutStatus.DRAFT,
        patientJson: patient,
        itemsJson: priced,
        subtotal,
        processingFee,
        total,
        currency: env.PAYMENT_CURRENCY.toLowerCase(),
        expiresAt,
      },
    });

    return {
      id: session.id,
      status: session.status,
      subtotal: session.subtotal,
      processingFee: session.processingFee,
      total: session.total,
      currency: session.currency,
      expiresAt: session.expiresAt,
    };
  }

  async getSession(params: { id: string; userId: string }) {
    const session = await prisma.checkoutSession.findUnique({ where: { id: params.id } });
    if (!session) throw new ApiError(httpStatus.NOT_FOUND, 'Checkout session not found');
    if (session.userId !== params.userId) throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    return session;
  }

  async submitSession(params: {
    id: string;
    userId: string;
    accessPayloadJson?: any;
    idempotencyKey?: string;
  }) {
    const session = await this.getSession({ id: params.id, userId: params.userId });

    if (session.expiresAt.getTime() < Date.now()) {
      if (session.status === CheckoutStatus.DRAFT) {
        await prisma.checkoutSession.update({
          where: { id: session.id },
          data: { status: CheckoutStatus.EXPIRED },
        });
      }
      throw new ApiError(httpStatus.GONE, 'Checkout session expired');
    }

    // If already submitted, return existing order + refreshed PI
    if (session.status === CheckoutStatus.SUBMITTED && session.orderId) {
      const payment = await paymentService.createOrUpdatePaymentIntentForOrder({
        orderId: session.orderId,
        userId: params.userId,
      });

      const orderWithItems = await prisma.order.findUnique({
        where: { id: session.orderId },
        include: { items: { include: { test: true, panel: true } } },
      });

      return {
        order: orderWithItems,
        clientSecret: payment.clientSecret,
        stripePaymentIntentId: payment.paymentIntentId,
      };
    }

    if (session.status !== CheckoutStatus.DRAFT) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Checkout session is not in DRAFT state (${session.status})`,
      );
    }

    const itemsInput: CheckoutItemInput[] = (session.itemsJson as any[]).map((i) => ({
      type: i.type,
      id: i.id,
      quantity: i.quantity,
    }));

    const { priced, subtotal, processingFee, total } = await this.priceItems(itemsInput);
    const derivedAccessPayload = await this.buildDerivedAccessPayload(
      session.patientJson,
      itemsInput,
    );
    const normalizedAccessPayload = this.mergeAccessPayload(
      params.accessPayloadJson,
      derivedAccessPayload,
    );
    const effectiveIdempotencyKey =
      params.idempotencyKey?.trim() || `checkout-submit:${params.userId}:${params.id}`;

    const order = await prisma.$transaction(async (tx) => {
      // lock-ish check inside tx
      const fresh = await tx.checkoutSession.findUnique({
        where: { id: session.id },
        select: { status: true, orderId: true, submitIdempotencyKey: true },
      });
      if (!fresh) throw new ApiError(httpStatus.NOT_FOUND, 'Checkout session not found');

      if (fresh.status === CheckoutStatus.SUBMITTED && fresh.orderId) {
        return await tx.order.findUniqueOrThrow({ where: { id: fresh.orderId } });
      }

      if (fresh.status !== CheckoutStatus.DRAFT) {
        throw new ApiError(
          httpStatus.CONFLICT,
          `Checkout session is not in DRAFT state (${fresh.status})`,
        );
      }

      // Claim this checkout submission once to prevent duplicate order creation on retries.
      const claim = await tx.checkoutSession.updateMany({
        where: {
          id: session.id,
          status: CheckoutStatus.DRAFT,
          submitIdempotencyKey: null,
        },
        data: {
          submitIdempotencyKey: effectiveIdempotencyKey,
        },
      });

      if (claim.count === 0) {
        const latest = await tx.checkoutSession.findUnique({
          where: { id: session.id },
          select: { status: true, orderId: true, submitIdempotencyKey: true },
        });

        if (latest?.status === CheckoutStatus.SUBMITTED && latest.orderId) {
          return await tx.order.findUniqueOrThrow({ where: { id: latest.orderId } });
        }

        if (
          latest?.status === CheckoutStatus.DRAFT &&
          latest.submitIdempotencyKey === effectiveIdempotencyKey
        ) {
          throw new ApiError(httpStatus.CONFLICT, 'Checkout submission is already in progress');
        }

        throw new ApiError(httpStatus.CONFLICT, 'Checkout session has already been claimed');
      }

      const created = await tx.order.create({
        data: {
          userId: session.userId,
          status: OrderStatus.PENDING_PAYMENT,
          subtotal,
          processingFee,
          total,
          accessPayloadJson: normalizedAccessPayload,
          currentTrackingStep: 1,
        },
      });

      for (const it of priced) {
        await tx.orderItem.create({
          data: {
            orderId: created.id,
            type: it.type === 'TEST' ? OrderItemType.TEST : OrderItemType.PANEL,
            testId: it.type === 'TEST' ? it.id : null,
            panelId: it.type === 'PANEL' ? it.id : null,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          },
        });
      }

      await tx.checkoutSession.update({
        where: { id: session.id },
        data: {
          status: CheckoutStatus.SUBMITTED,
          orderId: created.id,
          subtotal,
          processingFee,
          total,
          itemsJson: priced,
          submitIdempotencyKey: effectiveIdempotencyKey,
        },
      });

      return created;
    });

    // Create/reuse PI for order (Stripe idempotency is handled inside PaymentService)
    const payment = await paymentService.createOrUpdatePaymentIntentForOrder({
      orderId: order.id,
      userId: params.userId,
    });

    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: { include: { test: true, panel: true } } },
    });

    return {
      order: orderWithItems,
      clientSecret: payment.clientSecret,
      stripePaymentIntentId: payment.paymentIntentId,
    };
  }

  async expireOldSessions(now: Date = new Date()) {
    const result = await prisma.checkoutSession.updateMany({
      where: {
        status: CheckoutStatus.DRAFT,
        expiresAt: { lt: now },
      },
      data: { status: CheckoutStatus.EXPIRED },
    });

    return { expiredCount: result.count };
  }
}

export const checkoutService = new CheckoutService();
