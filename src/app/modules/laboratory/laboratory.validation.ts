import { z } from 'zod';

const booleanLike = z.union([z.boolean(), z.enum(['true', 'false'])]);

export const getLaboratoriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    isVisibleToCustomers: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['name', 'code', 'sortOrder', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const createLaboratorySchema = z.object({
  body: z
    .object({
      name: z.string().min(1, 'Name is required').max(255),
      displayName: z.union([z.string().max(255), z.null()]).optional(),
      code: z.string().min(1, 'Code is required').max(20),
      apiEndpoint: z.union([z.string().max(500), z.null()]).optional(),
      apiKeyEncrypted: z.union([z.string(), z.null()]).optional(),
      integrationType: z.union([z.string().max(50), z.null()]).optional(),
      supportsRealtimeSubmission: booleanLike.optional(),
      supportsResultsRetrieval: booleanLike.optional(),
      isActive: booleanLike.optional(),
      isVisibleToCustomers: booleanLike.optional(),
      sortOrder: z.coerce.number().int().nonnegative().optional(),
      notes: z.union([z.string(), z.null()]).optional(),
    })
    .strict(),
});

export const updateLaboratorySchema = z.object({
  params: z.object({
    laboratoryId: z.string().uuid('Invalid laboratory ID'),
  }),
  body: z
    .object({
      name: z.string().min(1).max(255).optional(),
      displayName: z.union([z.string().max(255), z.null()]).optional(),
      code: z.string().min(1).max(20).optional(),
      apiEndpoint: z.union([z.string().max(500), z.null()]).optional(),
      apiKeyEncrypted: z.union([z.string(), z.null()]).optional(),
      integrationType: z.union([z.string().max(50), z.null()]).optional(),
      supportsRealtimeSubmission: booleanLike.optional(),
      supportsResultsRetrieval: booleanLike.optional(),
      isActive: booleanLike.optional(),
      isVisibleToCustomers: booleanLike.optional(),
      sortOrder: z.coerce.number().int().nonnegative().optional(),
      notes: z.union([z.string(), z.null()]).optional(),
    })
    .strict(),
});

export const getLaboratoryByIdSchema = z.object({
  params: z.object({
    laboratoryId: z.string().uuid('Invalid laboratory ID'),
  }),
});
