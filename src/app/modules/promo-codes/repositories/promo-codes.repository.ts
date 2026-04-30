import { PrismaClient } from '@prisma/client';
import prisma from '../../../../shared/prisma';

export class PromoCodesRepository {
  constructor(private readonly db: PrismaClient = prisma as PrismaClient) {}

  findMany() {
    return this.db.promoCode.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findById(id: string) {
    return this.db.promoCode.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  findByCode(code: string) {
    return this.db.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        deletedAt: null,
      },
    });
  }

  create(data: Parameters<PrismaClient['promoCode']['create']>[0]['data']) {
    return this.db.promoCode.create({ data });
  }

  update(id: string, data: Parameters<PrismaClient['promoCode']['update']>[0]['data']) {
    return this.db.promoCode.update({
      where: { id },
      data,
    });
  }

  archive(id: string) {
    return this.db.promoCode.update({
      where: { id },
      data: {
        isActive: false,
        status: 'ARCHIVED',
        deletedAt: new Date(),
      },
    });
  }
}
