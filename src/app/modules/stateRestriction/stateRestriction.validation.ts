import { RestrictionType } from '@prisma/client';
import { z } from 'zod';

const booleanLike = z.union([z.boolean(), z.enum(['true', 'false'])]);
const stateCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, 'State code must be a 2-letter code');

export const getRestrictionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    stateCode: stateCodeSchema.optional(),
    testId: z.string().uuid('Invalid test ID').optional(),
    laboratoryId: z.string().uuid('Invalid laboratory ID').optional(),
    restrictionType: z.nativeEnum(RestrictionType).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['stateCode', 'restrictionType', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const getLocationStatusSchema = z.object({
  query: z.object({
    checkoutState: stateCodeSchema.optional(),
    zipCode: z
      .string()
      .trim()
      .regex(/^\d{5}$/, 'ZIP code must be 5 digits')
      .optional(),
    testId: z.string().uuid('Invalid test ID').optional(),
    laboratoryId: z.string().uuid('Invalid laboratory ID').optional(),
    publicIp: z
      .string()
      .trim()
      .min(3, 'Invalid public IP')
      .max(64, 'Invalid public IP')
      .optional(),
    laboratoryCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]+$/, 'Invalid laboratory code')
      .optional(),
  }),
});

export const createRestrictionSchema = z.object({
  body: z
    .object({
      stateCode: stateCodeSchema,
      testId: z.string().uuid('Invalid test ID').optional(),
      laboratoryId: z.string().uuid('Invalid laboratory ID').optional(),
      restrictionType: z.nativeEnum(RestrictionType),
      notes: z.union([z.string(), z.null()]).optional(),
      isActive: booleanLike.optional(),
    })
    .refine((body) => body.testId || body.laboratoryId, {
      message: 'At least one of testId or laboratoryId is required',
      path: ['testId'],
    }),
});

export const updateRestrictionSchema = z.object({
  params: z.object({
    restrictionId: z.string().uuid('Invalid restriction ID'),
  }),
  body: z
    .object({
      stateCode: stateCodeSchema.optional(),
      testId: z.union([z.string().uuid('Invalid test ID'), z.null()]).optional(),
      laboratoryId: z.union([z.string().uuid('Invalid laboratory ID'), z.null()]).optional(),
      restrictionType: z.nativeEnum(RestrictionType).optional(),
      notes: z.union([z.string(), z.null()]).optional(),
      isActive: booleanLike.optional(),
    })
    .strict(),
});

export const getRestrictionByIdSchema = z.object({
  params: z.object({
    restrictionId: z.string().uuid('Invalid restriction ID'),
  }),
});
