import { z } from 'zod';

const checkoutItemSchema = z.object({
  labTestId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(25).default(1),
  drawCenterId: z.string().uuid().optional(),
});

const patientSchema = z.object({
  relationToUser: z.enum(['SELF', 'SPOUSE', 'CHILD', 'PARENT', 'OTHER']).optional(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY', 'OTHER']).optional(),
  phoneNumber: z.string().trim().optional(),
  email: z.string().email().optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().length(2).optional(),
  zipCode: z.string().trim().optional(),
});

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    patient: patientSchema,
    promoCode: z.string().trim().min(1).optional(),
    drawCenterId: z.string().uuid().optional(),
    items: z.array(checkoutItemSchema).optional(),
  }),
});

export const submitCheckoutSessionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({}).optional(),
});
