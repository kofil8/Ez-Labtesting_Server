import { z } from 'zod';

const booleanLike = z.union([z.boolean(), z.enum(['true', 'false'])]);
const nullableNonNegativeNumber = z.union([z.coerce.number().nonnegative(), z.null()]);
const nullableInteger = z.union([z.coerce.number().int().nonnegative(), z.null()]);
const currencyCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, 'Currency must be a 3-letter code such as USD');

export const getLabTestsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    testId: z.string().uuid('Invalid test ID').optional(),
    laboratoryId: z.string().uuid('Invalid laboratory ID').optional(),
    isAvailable: z.enum(['true', 'false']).optional(),
    isVisible: z.enum(['true', 'false']).optional(),
    sortBy: z
      .enum(['labTestCode', 'retailPrice', 'salePrice', 'sortOrder', 'createdAt', 'updatedAt'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const createLabTestSchema = z.object({
  body: z
    .object({
      testId: z.string().uuid('Invalid test ID'),
      laboratoryId: z.string().uuid('Invalid laboratory ID'),
      labTestCode: z.string().min(1, 'Lab test code is required').max(50),
      externalTestId: z.union([z.string().max(100), z.null()]).optional(),
      labCost: z.coerce.number().nonnegative().optional(),
      retailPrice: z.coerce.number().nonnegative(),
      salePrice: nullableNonNegativeNumber.optional(),
      currency: currencyCode.optional(),
      isAvailable: booleanLike.optional(),
      isVisible: booleanLike.optional(),
      turnaroundDaysOverride: nullableInteger.optional(),
      specimenTypeOverride: z.union([z.string().max(100), z.null()]).optional(),
      patientInstructionsOverride: z.union([z.string(), z.null()]).optional(),
      sortOrder: z.coerce.number().int().nonnegative().optional(),
    })
    .strict(),
});

export const updateLabTestSchema = z.object({
  params: z.object({
    labTestId: z.string().uuid('Invalid lab test ID'),
  }),
  body: z
    .object({
      testId: z.string().uuid('Invalid test ID').optional(),
      laboratoryId: z.string().uuid('Invalid laboratory ID').optional(),
      labTestCode: z.string().min(1).max(50).optional(),
      externalTestId: z.union([z.string().max(100), z.null()]).optional(),
      labCost: z.coerce.number().nonnegative().optional(),
      retailPrice: z.coerce.number().nonnegative().optional(),
      salePrice: nullableNonNegativeNumber.optional(),
      currency: currencyCode.optional(),
      isAvailable: booleanLike.optional(),
      isVisible: booleanLike.optional(),
      turnaroundDaysOverride: nullableInteger.optional(),
      specimenTypeOverride: z.union([z.string().max(100), z.null()]).optional(),
      patientInstructionsOverride: z.union([z.string(), z.null()]).optional(),
      sortOrder: z.coerce.number().int().nonnegative().optional(),
    })
    .strict(),
});

export const getLabTestByIdSchema = z.object({
  params: z.object({
    labTestId: z.string().uuid('Invalid lab test ID'),
  }),
});
