import { z } from 'zod';

const optionalNumberString = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => value === undefined || value === '' || Number.isFinite(Number.parseFloat(value)),
    'Must be a valid number',
  );

const optionalBooleanString = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) =>
      value === undefined ||
      value === '' ||
      value === 'true' ||
      value === 'false' ||
      value === '1' ||
      value === '0',
    'Must be a valid boolean',
  );

export const labCenterQuerySchema = z.object({
  query: z.object({
    lat: optionalNumberString,
    lng: optionalNumberString,
    radius: optionalNumberString,
    search: z.string().trim().optional(),
    type: z.string().trim().optional(),
    providerCode: z.string().trim().optional(),
    providerCodes: z.string().trim().optional(),
    status: z.string().trim().optional(),
    isActive: optionalBooleanString,
  }),
});

export const nationwideLabQuerySchema = z.object({
  query: z.object({
    country: z.string().trim().optional(),
    providers: z.string().trim().optional(),
    page: optionalNumberString,
    pageSize: optionalNumberString,
  }),
});

export const geocodeSchema = z.object({
  body: z.object({
    address: z.string().trim().min(1, 'Address is required'),
  }),
});

export const autocompleteQuerySchema = z.object({
  query: z.object({
    input: z.string().trim().min(1, 'input is required'),
  }),
});

export const placeDetailsParamsSchema = z.object({
  params: z.object({
    placeId: z.string().trim().min(1, 'placeId is required'),
  }),
});

export const labCenterParamsSchema = z.object({
  params: z.object({
    labCenterId: z.string().trim().min(1, 'labCenterId is required'),
  }),
});
