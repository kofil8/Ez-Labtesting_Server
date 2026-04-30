import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '../../../../shared/prisma';

type DbClient = PrismaClient | Prisma.TransactionClient;

export class OrderTrackingRepository {
  constructor(private readonly db: DbClient = prisma) {}

  create(args: Prisma.OrderTrackingEventCreateArgs) {
    return this.db.orderTrackingEvent.create(args);
  }

  findByOrderId(orderId: string) {
    return this.db.orderTrackingEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
