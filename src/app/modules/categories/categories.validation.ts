import { z } from 'zod';

export const getAllCategoriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'sortOrder']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    slug: z.string().min(1, 'Slug cannot be empty').max(120),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(120).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    categoryId: z.string().uuid('Invalid category ID'),
  }),
});

export const getCategoryByIdSchema = z.object({
  params: z.object({
    categoryId: z.string().uuid('Invalid category ID'),
  }),
});
