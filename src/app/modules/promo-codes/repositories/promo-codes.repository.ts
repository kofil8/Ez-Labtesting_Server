import { PrismaClient } from '@prisma/client';
import prisma from '../../../../shared/prisma';

export class PromoCodesRepository {
  constructor(private readonly db: PrismaClient = prisma as PrismaClient) {}

  findByCode(code: string) {
    return this.db.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        deletedAt: null,
      },
    });
  }
}
