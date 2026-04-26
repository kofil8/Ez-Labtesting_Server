import { z } from 'zod';
import { normalizeTurnaround } from '../../utils/turnaroundNormalizer';

const numberFromStringInt = z.preprocess((val) => {
  if (typeof val === 'string' && val.trim() !== '') return Number(val);
  return val;
}, z.number().int().nonnegative());

const booleanFromString = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val === 'true') return true;
    if (val === 'false') return false;
  }
  return val;
}, z.boolean());

const stringArrayFromUnknown = z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      return val
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } catch {
      return val
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return val;
}, z.array(z.string()));

const turnaroundFromString = z.string().refine(
  (val) => {
    try {
      normalizeTurnaround(val);
      return true;
    } catch {
      return false;
    }
  },
  {
    message:
      'Invalid turnaround format. Use formats like: "24 hours", "24h", "3 days", "3d", "24-48 hours", "3-5 days", etc.',
  },
);

const baseBodyObjectSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  slug: z.string().min(1, 'Test slug is required'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  specimenType: z.string().optional(),
  cptCode: stringArrayFromUnknown.optional(),
  baseTurnaroundDays: turnaroundFromString.optional(),
  isPanel: booleanFromString.optional(),
  preparationInstructions: z.string().optional(),
  preperationInstructions: z.string().optional(), // backward compatibility
  internalNotes: z.string().optional(),
  interalNotes: z.string().optional(), // backward compatibility
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  searchKeywords: stringArrayFromUnknown.optional(),
  requiresFasting: booleanFromString.optional(),
  minAge: numberFromStringInt.optional(),
  maxAge: numberFromStringInt.optional(),
  isActive: booleanFromString.optional(),
  isPopular: booleanFromString.optional(),
  componentTestIds: stringArrayFromUnknown
    .pipe(z.array(z.string().uuid('Each componentTestId must be a valid UUID')))
    .optional(),
});

const applyBodyValidationRules = (
  data: z.infer<typeof baseBodyObjectSchema>,
  ctx: z.RefinementCtx,
) => {
  if (data.minAge !== undefined && data.maxAge !== undefined && data.minAge > data.maxAge) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['minAge'],
      message: 'minAge cannot be greater than maxAge',
    });
  }

  if (data.isPanel === true) {
    if (!data.componentTestIds || data.componentTestIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['componentTestIds'],
        message: 'Panel test must include at least one component test',
      });
    }
  }

  if (data.isPanel === false && data.componentTestIds?.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['componentTestIds'],
      message: 'Non-panel test cannot contain component tests',
    });
  }
};

const baseBodySchema = baseBodyObjectSchema.superRefine(applyBodyValidationRules);

const createTest = z.object({
  body: baseBodySchema,
});

const updateTest = z.object({
  params: z.object({
    testId: z.string().uuid('Invalid test ID'),
  }),
  body: baseBodyObjectSchema.partial().superRefine((data, ctx) => {
    if (data.minAge !== undefined && data.maxAge !== undefined && data.minAge > data.maxAge) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minAge'],
        message: 'minAge cannot be greater than maxAge',
      });
    }

    if (data.isPanel === false && data.componentTestIds?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['componentTestIds'],
        message: 'Non-panel test cannot contain component tests',
      });
    }
  }),
});

const getTestById = z.object({
  params: z.object({
    testId: z.string().min(1, 'Test identifier is required'),
  }),
});

const getPanelComponents = z.object({
  params: z.object({
    testId: z.string().min(1, 'Test identifier is required'),
  }),
});

const updatePanelComponents = z.object({
  params: z.object({
    testId: z.string().uuid('Invalid test ID'),
  }),
  body: z.object({
    componentTestIds: z
      .array(z.string().uuid('Each componentTestId must be a valid UUID'))
      .min(1, 'At least one component test is required'),
  }),
});

const getTests = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional(),
      sortBy: z
        .enum(['name', 'createdAt', 'updatedAt', 'isPopular', 'baseTurnaroundDays'])
        .optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      search: z.string().optional(),
      categoryId: z.string().uuid().optional(),
      isPanel: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
      requiresFasting: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
      isPopular: z
        .string()
        .transform((val) => val === 'true')
        .optional(),
      minAge: z.string().regex(/^\d+$/).transform(Number).optional(),
      maxAge: z.string().regex(/^\d+$/).transform(Number).optional(),
    })
    .strict(),
});

export const TestValidation = {
  createTest,
  updateTest,
  getTestById,
  getPanelComponents,
  updatePanelComponents,
  getTests,
};
