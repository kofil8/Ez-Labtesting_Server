import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    testId: z.string().uuid('Invalid test ID'),
    rating: z
      .number()
      .int()
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5'),
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must not exceed 200 characters'),
    comment: z
      .string()
      .min(10, 'Comment must be at least 10 characters')
      .max(1000, 'Comment must not exceed 1000 characters'),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().min(3).max(200).optional(),
    comment: z.string().min(10).max(1000).optional(),
  }),
});

export const getReviewsQuery = z.object({
  query: z.object({
    page: z
      .preprocess((val) => {
        if (typeof val === 'string' && val.trim() !== '') return Number(val);
        return val;
      }, z.number().int().min(1).default(1))
      .optional(),
    limit: z
      .preprocess((val) => {
        if (typeof val === 'string' && val.trim() !== '') return Number(val);
        return val;
      }, z.number().int().min(1).max(100).default(10))
      .optional(),
    sortBy: z
      .enum(['newest', 'oldest', 'highest', 'lowest', 'helpful'])
      .default('newest')
      .optional(),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>['body'];
export type GetReviewsQueryInput = z.infer<typeof getReviewsQuery>['query'];
