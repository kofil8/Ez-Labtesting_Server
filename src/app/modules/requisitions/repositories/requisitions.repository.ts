import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '../../../../shared/prisma';

type DbClient = PrismaClient | Prisma.TransactionClient;

export class RequisitionsRepository {
  constructor(private readonly db: DbClient = prisma) {}

  create(args: Prisma.RequisitionCreateArgs) {
    return this.db.requisition.create(args);
  }

  update(args: Prisma.RequisitionUpdateArgs) {
    return this.db.requisition.update(args);
  }

  findLatestByOrderId(orderId: string) {
    return this.db.requisition.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
