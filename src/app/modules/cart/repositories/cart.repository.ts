import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '../../../../shared/prisma';

type DbClient = PrismaClient | Prisma.TransactionClient;

export class CartRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findUserCart(userId: string) {
    return this.db.cartItem.findMany({
      where: { userId },
      include: {
        laboratory: true,
        labTest: {
          include: {
            test: true,
            laboratory: true,
          },
        },
        drawCenter: true,
        test: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findItemById(itemId: string) {
    return this.db.cartItem.findUnique({
      where: { id: itemId },
      include: {
        laboratory: true,
        labTest: {
          include: {
            test: true,
            laboratory: true,
          },
        },
        drawCenter: true,
        test: true,
      },
    });
  }

  upsertItem(args: Prisma.CartItemUpsertArgs) {
    return this.db.cartItem.upsert(args);
  }

  updateItem(args: Prisma.CartItemUpdateArgs) {
    return this.db.cartItem.update(args);
  }

  deleteItem(itemId: string) {
    return this.db.cartItem.delete({
      where: { id: itemId },
    });
  }

  deleteManyByUserId(userId: string) {
    return this.db.cartItem.deleteMany({
      where: { userId },
    });
  }
}
