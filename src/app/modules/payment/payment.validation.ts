import { z } from 'zod';

export const createPaymentIntentForOrderSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
});

export const confirmPaymentIntentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
});

export type CreatePaymentIntentForOrderRequest = z.infer<typeof createPaymentIntentForOrderSchema>;
export type ConfirmPaymentIntentRequest = z.infer<typeof confirmPaymentIntentSchema>;
