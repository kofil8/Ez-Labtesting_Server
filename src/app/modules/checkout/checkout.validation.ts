import { z } from 'zod';

export const checkoutItemSchema = z.object({
  type: z.enum(['TEST', 'PANEL']),
  id: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
});

const accessPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{8}$/, 'DOB must be in MMDDYYYY format (8 digits)'),
  gender: z.enum(['M', 'F', 'O']),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  email: z.string().email(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  middleInitial: z.string().optional(),
  race: z.string().optional(),
});

export const accessPayloadSchema = z
  .object({
    testCode: z.string().min(1).optional(),
    testCodes: z.array(z.string().min(1)).optional(),
    collectionType: z.string().min(1).default('PSC'),
    patient: accessPatientSchema,
    physicianNumber: z.string().optional(),
    collectionDate: z.string().optional(),
    collectionTime: z.string().optional(),
    orderComment: z.string().optional(),
    source: z.string().optional(),
    docchart: z.string().optional(),
    orderNumber: z.string().optional(),
  })
  .superRefine((payload, ctx) => {
    const hasTestCode = Boolean(payload.testCode && payload.testCode.trim().length > 0);
    const hasTestCodes = Array.isArray(payload.testCodes) && payload.testCodes.length > 0;

    if (!hasTestCode && !hasTestCodes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either testCode or testCodes is required in accessPayloadJson',
      });
    }
  });

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    patient: z.record(z.string(), z.unknown()),
    items: z.array(checkoutItemSchema).min(1),
    accessPayloadJson: accessPayloadSchema.optional(),
  }),
});

export const submitCheckoutSessionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    accessPayloadJson: accessPayloadSchema.optional(),
  }),
});
