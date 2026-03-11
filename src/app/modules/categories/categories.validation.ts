import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
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
