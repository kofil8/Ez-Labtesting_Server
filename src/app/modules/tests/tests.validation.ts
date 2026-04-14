import { z } from 'zod';
import { normalizeTurnaround } from '../../utils/turnaroundNormalizer';

const numberFromString = z.preprocess((val) => {
  if (typeof val === 'string' && val.trim() !== '') return Number(val);
  return val;
}, z.number());

const turnaroundTransform = z.preprocess((val) => {
  if (val === undefined || val === null) return undefined;
  try {
    const normalized = normalizeTurnaround(val as string | number);
    return normalized.hours;
  } catch (error) {
    throw new Error(`Invalid turnaround: ${(error as Error).message}`);
  }
}, z.number().int().nonnegative());

const testDetailSchema = z.object({
  turnaround: turnaroundTransform.optional(),
  specimenType: z.string().min(1, 'Specimen type is required'),
  component: z.string().min(1, 'Component is required'),
  method: z.string().min(1, 'Method is required'),
  collectionNotes: z.string().optional(),
  clinicalUtility: z.string().optional(),
  cptCode: z.string().min(1, 'CPT code is required'),
  testingLocatiion: z.string().min(1, 'Testing location is required'),
  temperatures: z.any().optional(),
  collectionMethod: z.string().optional(),
  resultsDelivery: z.string().optional(),
});

const testDetailsUnion = z.union([testDetailSchema, z.array(testDetailSchema)]).optional();

const getTestsQuery = z.object({
  query: z.object({
    page: numberFromString.optional(),
    limit: numberFromString.optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    minPrice: numberFromString.optional(),
    maxPrice: numberFromString.optional(),
    testCode: z.string().optional(),
    testName: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    categorySlug: z.string().optional(),
  }),
});

const createTest = z.object({
  body: z.object({
    testCode: z.string().min(1, 'Test code is required'),
    testName: z.string().min(1, 'Test name is required'),
    categoryId: z.string().uuid('Invalid category ID'),
    price: numberFromString,
    description: z.string().optional(),
    testImage: z.string().optional(),
    testDetails: testDetailsUnion,
  }),
});

const updateTest = z.object({
  params: z.object({
    id: z.string().min(1, 'Test ID is required'),
  }),
  body: z
    .object({
      testCode: z.string().optional(),
      testName: z.string().optional(),
      categoryId: z.string().uuid('Invalid category ID').optional(),
      price: numberFromString.optional(),
      description: z.string().optional(),
      testImage: z.string().optional(),
      testDetails: testDetailsUnion,
    })
    .partial(),
});

const getTestById = z.object({
  params: z.object({
    id: z.string().min(1, 'Test ID is required'),
  }),
});

export const TestValidation = {
  getTestsQuery,
  createTest,
  updateTest,
  getTestById,
};
