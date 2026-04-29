import { DiscountType, PromoCodeStatus } from '@prisma/client';
import { z } from 'zod';

const discountTypeSchema = z
  .enum(['percentage', 'fixed', DiscountType.PERCENT, DiscountType.FIXED])
  .transform((value) => {
    if (value === 'percentage') return DiscountType.PERCENT;
    if (value === 'fixed') return DiscountType.FIXED;
    return value;
  });

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return null;
    return new Date(value);
  });

export const createPromoCodeSchema = z.object({
  body: z.object({
    code: z.string().trim().min(2).max(50),
    discountType: discountTypeSchema,
    discountValue: z.coerce.number().min(0),
    minPurchaseAmount: z.coerce.number().min(0).optional().nullable(),
    minOrder: z.coerce.number().min(0).optional().nullable(),
    usageLimit: z.coerce.number().int().min(1).optional().nullable(),
    maxUses: z.coerce.number().int().min(1).optional().nullable(),
    validFrom: optionalDateSchema,
    startsAt: optionalDateSchema,
    validUntil: optionalDateSchema,
    expiresAt: optionalDateSchema,
    enabled: z.boolean().optional(),
    isActive: z.boolean().optional(),
    status: z.nativeEnum(PromoCodeStatus).optional(),
    minimumMarginAmount: z.coerce.number().min(0).optional().nullable(),
    perUserLimit: z.coerce.number().int().min(1).optional().nullable(),
  }),
});

export const updatePromoCodeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: createPromoCodeSchema.shape.body.partial(),
});

export const promoCodeIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
