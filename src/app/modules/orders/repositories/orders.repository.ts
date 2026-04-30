import { OrderStatus, Prisma, PrismaClient } from '@prisma/client';
import prisma from '../../../../shared/prisma';

type DbClient = PrismaClient | Prisma.TransactionClient;

const orderInclude = {
  laboratory: true,
  drawCenter: true,
  patient: true,
  orderItems: {
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
  promoCodes: {
    include: {
      promoCode: true,
    },
  },
  requisitions: {
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
} satisfies Prisma.OrderInclude;

export class OrdersRepository {
  constructor(private readonly db: DbClient = prisma) {}

  create(args: Prisma.OrderCreateArgs) {
    return this.db.order.create(args);
  }

  update(args: Prisma.OrderUpdateArgs) {
    return this.db.order.update(args);
  }

  findById(id: string) {
    return this.db.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  findByPaymentIntentId(stripePaymentIntentId: string) {
    return this.db.order.findFirst({
      where: { stripePaymentIntentId },
      include: orderInclude,
    });
  }

  listByUserId(userId: string) {
    return this.db.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  listManualReview(limit: number) {
    return this.db.order.findMany({
      where: {
        orderStatus: {
          in: ['LAB_SUBMISSION_FAILED', 'MANUAL_REVIEW_REQUIRED'],
        },
      },
      include: orderInclude,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  findLatestResumableByUserId(userId: string) {
    return this.db.order.findFirst({
      where: {
        userId,
        orderStatus: {
          in: [
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.AWAITING_USER_CONFIRMATION,
            OrderStatus.READY_FOR_LAB_SUBMISSION,
            OrderStatus.LAB_SUBMISSION_FAILED,
            OrderStatus.MANUAL_REVIEW_REQUIRED,
          ],
        },
      },
      include: orderInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  listAll(page: number, limit: number) {
    return this.db.order.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findStaleOrders(now: Date) {
    return this.db.order.findMany({
      where: {
        orderStatus: {
          in: ['PENDING_PAYMENT', 'AWAITING_USER_CONFIRMATION'],
        },
        updatedAt: {
          lt: now,
        },
      },
      include: orderInclude,
    });
  }
}
