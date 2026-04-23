import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiErrors';
import stateRestrictionService from '../stateRestriction/stateRestriction.service';
import { promoCodesService } from '../promo-codes/services/promo-codes.service';
import { CartRepository } from './repositories/cart.repository';

type CartSummary = {
  laboratoryId: string | null;
  laboratoryCode: string | null;
  items: Array<{
    id: string;
    labTestId: string;
    testId: string;
    testName: string;
    laboratoryId: string;
    laboratoryCode: string;
    quantity: number;
    baseRetailPrice: number;
    effectiveUnitPrice: number;
    lineTotal: number;
    drawCenterId: string | null;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  promoClamped: boolean;
};

class CartService {
  private readonly repository = new CartRepository();

  private round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private async resolveLabTest(labTestId: string) {
    return prisma.labTest.findUnique({
      where: { id: labTestId },
      include: {
        test: true,
        laboratory: true,
      },
    });
  }

  async addItem(input: { userId: string; labTestId: string; quantity: number; drawCenterId?: string }) {
    const candidate = await this.resolveLabTest(input.labTestId);

    if (!candidate || !candidate.isAvailable || !candidate.isVisible || !candidate.test.isActive) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Selected test is not available');
    }

    if (!candidate.laboratory.isActive || !candidate.laboratory.isVisibleToCustomers) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Selected laboratory is not active');
    }

    if ((candidate.laboratory.code || '').toUpperCase() !== 'ACCESS') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Only ACCESS laboratory is active');
    }

    const existingCart = await this.repository.findUserCart(input.userId);
    const existingLaboratoryId = existingCart[0]?.laboratoryId;
    if (existingLaboratoryId && existingLaboratoryId !== candidate.laboratoryId) {
      throw new ApiError(httpStatus.CONFLICT, 'Cart can contain tests from only one laboratory');
    }

    if (input.drawCenterId) {
      const drawCenter = await prisma.drawCenter.findUnique({
        where: { id: input.drawCenterId },
      });
      if (!drawCenter || drawCenter.laboratoryId !== candidate.laboratoryId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Draw center does not belong to the cart laboratory');
      }
    }

    const baseRetailPrice = Number(candidate.retailPrice);
    const effectiveUnitPrice = Number(candidate.salePrice ?? candidate.retailPrice);

    await this.repository.upsertItem({
      where: {
        userId_labTestId: {
          userId: input.userId,
          labTestId: input.labTestId,
        },
      },
      create: {
        userId: input.userId,
        testId: candidate.testId,
        laboratoryId: candidate.laboratoryId,
        labTestId: candidate.id,
        drawCenterId: input.drawCenterId || null,
        quantity: input.quantity,
        currency: candidate.currency,
        baseRetailPrice,
        effectiveUnitPrice,
      },
      update: {
        quantity: input.quantity,
        drawCenterId: input.drawCenterId || null,
        currency: candidate.currency,
        baseRetailPrice,
        effectiveUnitPrice,
      },
    });

    return this.getCart(input.userId);
  }

  async getCart(userId: string, promoCode?: string): Promise<CartSummary> {
    const items = await this.repository.findUserCart(userId);
    return this.buildCartSummary(items, promoCode);
  }

  async updateItem(input: {
    userId: string;
    itemId: string;
    quantity?: number;
    drawCenterId?: string | null;
  }) {
    const existing = await this.repository.findItemById(input.itemId);
    if (!existing || existing.userId !== input.userId) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Cart item not found');
    }

    if (input.drawCenterId) {
      const drawCenter = await prisma.drawCenter.findUnique({
        where: { id: input.drawCenterId },
      });
      if (!drawCenter || drawCenter.laboratoryId !== existing.laboratoryId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Draw center does not belong to the cart laboratory');
      }
    }

    await this.repository.updateItem({
      where: { id: input.itemId },
      data: {
        ...(input.quantity ? { quantity: input.quantity } : {}),
        ...(input.drawCenterId !== undefined ? { drawCenterId: input.drawCenterId } : {}),
      },
    });

    return this.getCart(input.userId);
  }

  async removeItem(userId: string, itemId: string) {
    const existing = await this.repository.findItemById(itemId);
    if (!existing || existing.userId !== userId) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Cart item not found');
    }

    await this.repository.deleteItem(itemId);
    return this.getCart(userId);
  }

  async validateCart(input: { userId: string; req: any; state?: string; promoCode?: string }) {
    const cart = await this.getCart(input.userId, input.promoCode);

    if (!cart.items.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cart is empty');
    }

    for (const item of cart.items) {
      const restrictionStatus = await stateRestrictionService.getLocationStatus({
        req: input.req,
        checkoutState: input.state,
        testId: item.testId,
        laboratoryId: item.laboratoryId,
        laboratoryCode: cart.laboratoryCode || undefined,
      });

      if (!restrictionStatus.canOrder) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          restrictionStatus.reason || 'This test cannot be ordered for the selected location',
        );
      }
    }

    return cart;
  }

  async clearCart(userId: string) {
    await this.repository.deleteManyByUserId(userId);
  }

  private async buildCartSummary(items: Array<any>, promoCode?: string): Promise<CartSummary> {
    const normalizedItems = items.map((item) => ({
      id: item.id,
      labTestId: item.labTestId,
      testId: item.testId,
      testName: item.test.name,
      laboratoryId: item.laboratoryId,
      laboratoryCode: item.laboratory.code,
      quantity: item.quantity,
      baseRetailPrice: Number(item.baseRetailPrice),
      effectiveUnitPrice: Number(item.effectiveUnitPrice),
      lineTotal: this.round2(Number(item.effectiveUnitPrice) * item.quantity),
      drawCenterId: item.drawCenterId || null,
      labCost: Number(item.labTest.labCost),
    }));

    const subtotal = this.round2(normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    let discount = 0;
    let promoClamped = false;

    if (promoCode) {
      const promo = await promoCodesService.validateForCheckout({
        code: promoCode,
        subtotal,
        items: normalizedItems.map((item) => ({
          quantity: item.quantity,
          effectiveUnitPrice: item.effectiveUnitPrice,
          labCost: item.labCost,
        })),
      });

      discount = this.round2(promo.appliedDiscount);
      promoClamped = promo.clamped;
    }

    return {
      laboratoryId: normalizedItems[0]?.laboratoryId || null,
      laboratoryCode: normalizedItems[0]?.laboratoryCode || null,
      items: normalizedItems.map(({ labCost, ...item }) => item),
      subtotal,
      discount,
      total: this.round2(subtotal - discount),
      promoCode: promoCode || null,
      promoClamped,
    };
  }
}

export const cartService = new CartService();
