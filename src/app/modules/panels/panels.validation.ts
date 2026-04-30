import { z } from 'zod';

const numberFromString = z.preprocess((val) => {
  if (typeof val === 'string' && val.trim() !== '') return Number(val);
  return val;
}, z.number().optional());

// Create Panel Schema
const createTestPanel = z.object({
  body: z.object({
    name: z.string().min(1, 'Panel name is required').max(200),
    description: z.string().optional(),
    basePrice: z.coerce.number().positive('Base price must be positive'),
    discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
    isActive: z.boolean().optional().default(true),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    testIds: z.array(z.string()).min(1, 'At least one test is required'),
  }),
});

// Update Panel Schema
const updateTestPanel = z.object({
  params: z.object({
    panelId: z.string().min(1, 'Panel ID is required'),
  }),
  body: z
    .object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      basePrice: z.coerce.number().positive().optional(),
      discountPercent: z.coerce.number().min(0).max(100).optional(),
      isActive: z.boolean().optional(),
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().optional(),
      testIds: z.array(z.string()).optional(),
    })
    .strict(),
});

// Get Panels Query Schema
const getPanelsQuery = z.object({
  query: z.object({
    page: numberFromString,
    limit: numberFromString,
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    minPrice: numberFromString,
    maxPrice: numberFromString,
  }),
});

// Get Panel by ID Schema
const getPanelById = z.object({
  params: z.object({
    panelId: z.string().min(1, 'Panel ID is required'),
  }),
});

// Delete Panel Schema
const deleteTestPanel = z.object({
  params: z.object({
    panelId: z.string().min(1, 'Panel ID is required'),
  }),
});

export const PanelValidation = {
  createTestPanel,
  updateTestPanel,
  getPanelsQuery,
  getPanelById,
  deleteTestPanel,
};
