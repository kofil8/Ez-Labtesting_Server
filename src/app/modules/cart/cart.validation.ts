import { z } from 'zod';

export const addCartItemSchema = z.object({
  body: z.object({
    labTestId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).max(25).default(1),
    drawCenterId: z.string().uuid().optional(),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    itemId: z.string().uuid(),
  }),
  body: z.object({
    quantity: z.coerce.number().int().min(1).max(25).optional(),
    drawCenterId: z.string().uuid().nullable().optional(),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    itemId: z.string().uuid(),
  }),
});

export const applyPromoCodeSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1),
  }),
});

export const validateCartSchema = z.object({
  body: z.object({
    state: z.string().trim().length(2).optional(),
    promoCode: z.string().trim().min(1).optional(),
  }),
});
