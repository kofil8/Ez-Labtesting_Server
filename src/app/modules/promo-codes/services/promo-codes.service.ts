import { DiscountType, PromoCodeStatus } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';
import { PromoCodesRepository } from '../repositories/promo-codes.repository';

type PromoEligibilityItem = {
  quantity: number;
  effectiveUnitPrice: number;
  labCost: number;
};

type ValidatePromoInput = {
  code: string;
  subtotal: number;
  items: PromoEligibilityItem[];
  now?: Date;
};

export class PromoCodesService {
  private readonly repository = new PromoCodesRepository();

  async validateForCheckout(input: ValidatePromoInput) {
    const promo = await this.repository.findByCode(input.code.trim().toUpperCase());
    if (!promo || !promo.isActive || promo.status === PromoCodeStatus.ARCHIVED) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Promo code is not available');
    }

    const now = input.now || new Date();
    if (promo.startsAt && promo.startsAt > now) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Promo code is not active yet');
    }

    if (promo.expiresAt && promo.expiresAt < now) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Promo code has expired');
    }

    if (promo.status && !['ACTIVE', 'DRAFT'].includes(promo.status)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Promo code is ${promo.status.toLowerCase()}`);
    }

    if (promo.minOrder && Number(promo.minOrder) > input.subtotal) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Order subtotal does not meet promo minimum');
    }

    if (promo.maxUses !== null && promo.maxUses !== undefined && promo.usedCount >= promo.maxUses) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Promo code usage limit reached');
    }

    const requestedDiscount =
      promo.discountType === DiscountType.PERCENT
        ? (input.subtotal * Number(promo.discountValue)) / 100
        : Number(promo.discountValue);

    const noLossFloor = input.items.reduce((sum, item) => sum + item.labCost * item.quantity, 0);
    const explicitFloor = promo.minimumMarginAmount
      ? noLossFloor + Number(promo.minimumMarginAmount)
      : noLossFloor;
    const maxDiscount = Math.max(0, input.subtotal - explicitFloor);
    const appliedDiscount = Math.min(requestedDiscount, maxDiscount);

    return {
      promo,
      requestedDiscount,
      appliedDiscount,
      clamped: appliedDiscount < requestedDiscount,
    };
  }
}

export const promoCodesService = new PromoCodesService();
