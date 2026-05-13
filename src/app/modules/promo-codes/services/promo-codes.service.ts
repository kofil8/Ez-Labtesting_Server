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

  private serialize(promo: any) {
    return {
      id: promo.id,
      code: promo.code,
      discountType: promo.discountType === DiscountType.PERCENT ? 'percentage' : 'fixed',
      discountValue: Number(promo.discountValue),
      minPurchaseAmount:
        promo.minOrder === null || promo.minOrder === undefined
          ? undefined
          : Number(promo.minOrder),
      validFrom:
        promo.startsAt?.toISOString() || promo.createdAt?.toISOString() || new Date().toISOString(),
      validUntil:
        promo.expiresAt?.toISOString() ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: promo.maxUses ?? undefined,
      usageCount: promo.usedCount,
      enabled: Boolean(promo.isActive) && promo.status !== PromoCodeStatus.ARCHIVED,
      applicableTo: 'all',
      status: promo.status,
      minimumMarginAmount:
        promo.minimumMarginAmount === null || promo.minimumMarginAmount === undefined
          ? undefined
          : Number(promo.minimumMarginAmount),
      perUserLimit: promo.perUserLimit ?? undefined,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
    };
  }

  private normalizePayload(input: any) {
    const startsAt = input.startsAt ?? input.validFrom ?? undefined;
    const expiresAt = input.expiresAt ?? input.validUntil ?? undefined;
    const minOrder = input.minOrder ?? input.minPurchaseAmount ?? undefined;
    const maxUses = input.maxUses ?? input.usageLimit ?? undefined;
    const isActive = input.isActive ?? input.enabled ?? undefined;

    return {
      ...(input.code !== undefined ? { code: String(input.code).trim().toUpperCase() } : {}),
      ...(input.discountType !== undefined ? { discountType: input.discountType } : {}),
      ...(input.discountValue !== undefined ? { discountValue: input.discountValue } : {}),
      ...(minOrder !== undefined ? { minOrder } : {}),
      ...(input.minimumMarginAmount !== undefined
        ? { minimumMarginAmount: input.minimumMarginAmount }
        : {}),
      ...(input.perUserLimit !== undefined ? { perUserLimit: input.perUserLimit } : {}),
      ...(maxUses !== undefined ? { maxUses } : {}),
      ...(startsAt !== undefined ? { startsAt } : {}),
      ...(expiresAt !== undefined ? { expiresAt } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    };
  }

  async list() {
    const promos = await this.repository.findMany();
    return promos.map((promo) => this.serialize(promo));
  }

  async listActive() {
    const promos = await this.repository.findMany();
    const now = new Date();

    const activePromos = promos.filter((promo) => {
      if (!promo.isActive) return false;
      if (promo.status === PromoCodeStatus.ARCHIVED) return false;
      if (promo.status && !['ACTIVE'].includes(promo.status)) return false;
      if (promo.startsAt && promo.startsAt > now) return false;
      if (promo.expiresAt && promo.expiresAt < now) return false;
      if (
        promo.maxUses !== null &&
        promo.maxUses !== undefined &&
        promo.usedCount >= promo.maxUses
      ) {
        return false;
      }
      return true;
    });

    return activePromos.map((promo) => {
      const serialized = this.serialize(promo);
      // Strip sensitive admin fields for public consumption
      return {
        id: serialized.id,
        code: serialized.code,
        discountType: serialized.discountType,
        discountValue: serialized.discountValue,
        minPurchaseAmount: serialized.minPurchaseAmount,
        validFrom: serialized.validFrom,
        validUntil: serialized.validUntil,
        enabled: serialized.enabled,
      };
    });
  }

  async getById(id: string) {
    const promo = await this.repository.findById(id);
    if (!promo) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Promo code not found');
    }

    return this.serialize(promo);
  }

  async create(input: any) {
    const existing = await this.repository.findByCode(input.code.trim().toUpperCase());
    if (existing) {
      throw new ApiError(httpStatus.CONFLICT, 'Promo code already exists');
    }

    const promo = await this.repository.create({
      code: input.code.trim().toUpperCase(),
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrder: input.minOrder ?? input.minPurchaseAmount ?? null,
      minimumMarginAmount: input.minimumMarginAmount ?? null,
      perUserLimit: input.perUserLimit ?? null,
      maxUses: input.maxUses ?? input.usageLimit ?? null,
      startsAt: input.startsAt ?? input.validFrom ?? null,
      expiresAt: input.expiresAt ?? input.validUntil ?? null,
      isActive: input.isActive ?? input.enabled ?? true,
      status: input.status ?? PromoCodeStatus.ACTIVE,
    });

    return this.serialize(promo);
  }

  async update(id: string, input: any) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Promo code not found');
    }

    const nextCode = input.code?.trim().toUpperCase();
    if (nextCode && nextCode !== existing.code) {
      const duplicate = await this.repository.findByCode(nextCode);
      if (duplicate && duplicate.id !== id) {
        throw new ApiError(httpStatus.CONFLICT, 'Promo code already exists');
      }
    }

    const promo = await this.repository.update(id, this.normalizePayload(input));
    return this.serialize(promo);
  }

  async archive(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Promo code not found');
    }

    await this.repository.archive(id);
    return null;
  }

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
