import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import ApiError from '../../errors/ApiErrors';
import { deleteFile } from '../../helpers/fileUploadHelper';
import { calculatePagination } from '../../utils/calculatePagination';
import pickValidFields from '../../utils/pickValidFields';
import { normalizeTurnaround } from '../../utils/turnaroundNormalizer';

type TestDetailInput = {
  turnaround?: number | string;
  component: string;
  method: string;
  collectionNotes?: string | null;
  clinicalUtility?: string | null;
  cptCode: string;
  testingLocatiion: string;
  temperatures?: unknown;
  collectionMethod?: string | null;
  resultsDelivery?: string | null;
};

type CreateTestPayload = {
  testCode: string;
  testName: string;
  price: number | string;
  categoryId: string;
  turnaround?: number | string;
  specimenType?: string;
  description?: string | null;
  testImage?: string | null;
  testDetails?: TestDetailInput | TestDetailInput[];
  isPublished?: boolean | string;
  isActive?: boolean | string;
};

const toNumber = (value: number | string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toTurnaroundHours = (value: number | string | undefined): number | undefined => {
  if (value === undefined) return undefined;

  console.log('[DEBUG] toTurnaroundHours - Input type:', typeof value, 'Value:', value);

  try {
    const normalized = normalizeTurnaround(value);
    console.log(
      '[DEBUG] toTurnaroundHours - Normalized successfully:',
      normalized.hours,
      'hours (',
      normalized.displayFormat,
      ')',
    );
    return normalized.hours;
  } catch (error) {
    console.error(
      '[ERROR] toTurnaroundHours - Failed to normalize:',
      error instanceof Error ? error.message : error,
    );
    // Re-throw the error instead of returning undefined so validation can catch it
    throw error;
  }
};

const toJsonValue = (val: unknown): Prisma.InputJsonValue | undefined => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return parsed as Prisma.InputJsonValue;
    } catch {
      // If it's a plain string that isn't JSON, store as string
      return val as unknown as Prisma.InputJsonValue;
    }
  }
  return val as Prisma.InputJsonValue;
};

const normalizeTestDetails = (
  details?: TestDetailInput | TestDetailInput[] | string,
): TestDetailInput[] => {
  if (!details) return [] as TestDetailInput[];

  let list: unknown = details;
  if (typeof details === 'string') {
    try {
      list = JSON.parse(details);
    } catch {
      // Single string detail: not valid JSON object; return empty to avoid invalid create
      return [] as TestDetailInput[];
    }
  }

  const arr = Array.isArray(list) ? list : [list];
  return arr
    .map((item) => {
      if (typeof item === 'string') {
        try {
          item = JSON.parse(item);
        } catch {
          // Skip invalid entries
          return {
            component: '',
            method: '',
            cptCode: '',
            testingLocatiion: '',
          } as TestDetailInput;
        }
      }

      const detail = item as TestDetailInput;
      return {
        ...detail,
        turnaround: toNumber(detail.turnaround),
        temperatures: toJsonValue(detail.temperatures),
      };
    })
    .filter((d) => !!d.component && !!d.method && !!d.cptCode && !!d.testingLocatiion);
};

const searchableFields: Array<keyof Prisma.TestWhereInput> = [
  'testCode',
  'testName',
  'description',
];

type GetTestsQuery = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: Prisma.SortOrder;
  search?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  testCode?: string;
  testName?: string;
  description?: string;
  categoryId?: string;
  categorySlug?: string;
  isPublished?: boolean | string;
  isActive?: boolean | string;
  adminView?: boolean | string;
};

const getTestsDB = async (query: GetTestsQuery = {}) => {
  const {
    search,
    minPrice,
    maxPrice,
    categoryId,
    categorySlug,
    isPublished,
    isActive,
    adminView,
    ...rest
  } = query;
  const pagination = calculatePagination({
    ...rest,
    page: toNumber(rest.page),
    limit: toNumber(rest.limit),
  });

  const filters = pickValidFields(rest, ['testCode', 'testName', 'description']);

  const andConditions: Prisma.TestWhereInput[] = [];

  // If not admin view, only show published and active tests
  const isAdminView = adminView === true || adminView === 'true';
  if (!isAdminView) {
    andConditions.push({ isPublished: true, isActive: true });
  } else {
    // Admin view: allow filtering by isPublished and isActive
    if (isPublished !== undefined) {
      const publishedValue = isPublished === true || isPublished === 'true';
      andConditions.push({ isPublished: publishedValue });
    }
    if (isActive !== undefined) {
      const activeValue = isActive === true || isActive === 'true';
      andConditions.push({ isActive: activeValue });
    }
  }

  // Filter by categoryId
  if (categoryId) {
    andConditions.push({ categoryId });
  }

  // categorySlug removed (slug field no longer on Category model)

  if (search) {
    andConditions.push({
      OR: searchableFields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      })) as Prisma.TestWhereInput[],
    });
  }

  if (filters.testCode) {
    andConditions.push({ testCode: { contains: filters.testCode, mode: 'insensitive' } });
  }
  if (filters.testName) {
    andConditions.push({ testName: { contains: filters.testName, mode: 'insensitive' } });
  }
  if (filters.description) {
    andConditions.push({ description: { contains: filters.description, mode: 'insensitive' } });
  }

  const minPriceNum = toNumber(minPrice as any);
  const maxPriceNum = toNumber(maxPrice as any);
  if (minPriceNum !== undefined) {
    andConditions.push({ price: { gte: minPriceNum } });
  }
  if (maxPriceNum !== undefined) {
    andConditions.push({ price: { lte: maxPriceNum } });
  }

  const where: Prisma.TestWhereInput = andConditions.length ? { AND: andConditions } : {};

  console.log('[DEBUG] getTestsDB - Query params:', {
    search,
    minPrice,
    maxPrice,
    categoryId,
    categorySlug,
    isPublished,
    isActive,
    adminView,
  });
  console.log('[DEBUG] getTestsDB - Is admin view:', isAdminView);
  console.log('[DEBUG] getTestsDB - Filter conditions:', JSON.stringify(andConditions, null, 2));

  const tests = await prisma.test.findMany({
    where,
    skip: pagination.skip,
    take: pagination.limit,
    orderBy: { [pagination.sortBy]: pagination.sortOrder },
    select: {
      id: true,
      testCode: true,
      testName: true,
      price: true,
      turnaround: true,
      specimenType: true,
      testImage: true,
      categoryId: true,
      description: true,
      isPublished: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      testDetails: {
        select: {
          id: true,
          testId: true,
          turnaround: true,
          component: true,
          method: true,
          collectionMethod: true,
          clinicalUtility: true,
          cptCode: true,
          testingLocatiion: true,
          temperatures: true,
          collectionNotes: true,
          resultsDelivery: true,
        },
      },
    },
  });

  console.log('[DEBUG] getTestsDB - Found tests count:', tests.length);

  const total = await prisma.test.count({ where });

  console.log('[DEBUG] getTestsDB - Total tests matching filter:', total);

  return {
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
    },
    data: tests,
  };
};

const getTestByIdDB = async (id: string) => {
  const test = await prisma.test.findUnique({
    where: { id },
    select: {
      id: true,
      testCode: true,
      testName: true,
      price: true,
      turnaround: true,
      specimenType: true,
      testImage: true,
      categoryId: true,
      description: true,
      isPublished: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      testDetails: {
        select: {
          id: true,
          testId: true,
          turnaround: true,
          component: true,
          method: true,
          collectionMethod: true,
          clinicalUtility: true,
          cptCode: true,
          testingLocatiion: true,
          temperatures: true,
          collectionNotes: true,
          resultsDelivery: true,
        },
      },
    },
  });

  if (!test) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
  }
  return test;
};

const createTestInDB = async (payload: any, file: any) => {
  const testImage = file ? file.location : null;
  const parsedPayload: CreateTestPayload =
    typeof payload === 'string' ? JSON.parse(payload) : payload;

  console.log('[DEBUG] createTestInDB - Raw payload:', JSON.stringify(payload).substring(0, 200));
  console.log(
    '[DEBUG] createTestInDB - Turnaround value from payload:',
    parsedPayload.turnaround,
    'Type:',
    typeof parsedPayload.turnaround,
  );

  const {
    testCode,
    testName,
    categoryId,
    price,
    turnaround,
    specimenType,
    description,
    testDetails,
    isPublished,
    isActive,
  } = parsedPayload;

  // Validate required fields
  if (!testCode?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Test code is required');
  }
  if (!testName?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Test name is required');
  }
  if (!categoryId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Category ID is required');
  }
  if (!price || toNumber(price) === undefined || toNumber(price)! <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Valid price is required');
  }
  if (!testImage) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Test image is required');
  }

  // Validate turnaround
  if (turnaround !== undefined) {
    try {
      const normalized = toTurnaroundHours(turnaround);
      if (normalized === undefined) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid turnaround time format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid turnaround time';
      throw new ApiError(httpStatus.BAD_REQUEST, `Turnaround time error: ${errorMessage}`);
    }
  }

  if (!specimenType?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Specimen type is required');
  }

  // Validate category exists
  const categoryExists = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!categoryExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid category ID');
  }

  // Normalize test details (optional - can be empty)
  const normalizedDetails = testDetails ? normalizeTestDetails(testDetails) : [];

  const newTest = await prisma.test.create({
    data: {
      testCode: testCode.trim(),
      testName: testName.trim(),
      categoryId,
      price: toNumber(price)!,
      turnaround: toTurnaroundHours(turnaround) ?? 0,
      specimenType: specimenType.trim(),
      description: description?.trim() || null,
      testImage,
      isPublished: isPublished === true || isPublished === 'true',
      isActive: isActive !== false && isActive !== 'false',
      testDetails:
        normalizedDetails.length > 0
          ? {
              create: normalizedDetails.map(({ turnaround, temperatures, ...detail }) => ({
                ...detail,
                turnaround: toNumber(turnaround),
                temperatures: toJsonValue(temperatures),
              })),
            }
          : undefined,
    },
    include: {
      category: true,
      testDetails: true,
    },
  });

  return newTest;
};

const updateTestInDB = async (id: string, payload: any, file: any) => {
  const existingTest = await prisma.test.findUnique({ where: { id } });
  if (!existingTest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
  }

  let testImage = existingTest.testImage;

  // Handle new image upload
  if (file && file.location) {
    // Delete old image if exists
    if (existingTest.testImage) {
      try {
        await deleteFile(existingTest.testImage);
      } catch (error) {
        console.error('Failed to delete old test image:', error);
      }
    }
    testImage = file.location;
  }

  const rawPayload = typeof payload === 'string' ? JSON.parse(payload) : (payload ?? {});
  const parsedPayload: Partial<CreateTestPayload> = rawPayload;

  console.log(
    '[DEBUG] updateTestInDB - Raw payload turnaround:',
    rawPayload.turnaround,
    'Type:',
    typeof rawPayload.turnaround,
  );

  const {
    testCode,
    testName,
    categoryId,
    price,
    turnaround,
    specimenType,
    description,
    testDetails,
    isPublished,
    isActive,
  } = parsedPayload;

  // Validate fields if provided
  if (testCode !== undefined && !testCode?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Test code cannot be empty');
  }
  if (testName !== undefined && !testName?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Test name cannot be empty');
  }
  if (price !== undefined) {
    const priceNum = toNumber(price);
    if (priceNum === undefined || priceNum <= 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Price must be greater than 0');
    }
  }

  // Validate turnaround
  if (turnaround !== undefined) {
    try {
      const normalized = toTurnaroundHours(turnaround);
      if (normalized === undefined) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid turnaround time format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid turnaround time';
      throw new ApiError(httpStatus.BAD_REQUEST, `Turnaround time error: ${errorMessage}`);
    }
  }

  if (specimenType !== undefined && !specimenType?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Specimen type cannot be empty');
  }

  // Validate category if provided
  if (categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid category ID');
    }
  }

  // Handle test details update (optional)
  const hasDetailsUpdate = testDetails !== undefined;
  const normalizedDetails = hasDetailsUpdate ? normalizeTestDetails(testDetails) : undefined;

  const updatedTest = await prisma.$transaction(async (tx) => {
    // Delete existing test details if updating
    if (hasDetailsUpdate) {
      await tx.testDetail.deleteMany({ where: { testId: id } });
    }

    // Build update data
    const data: Prisma.TestUpdateInput = {};

    if (testCode !== undefined) data.testCode = testCode.trim();
    if (testName !== undefined) data.testName = testName.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (categoryId !== undefined) data.category = { connect: { id: categoryId } };
    if (price !== undefined) data.price = toNumber(price)!;
    if (turnaround !== undefined) data.turnaround = toTurnaroundHours(turnaround) ?? 0;
    if (specimenType !== undefined) data.specimenType = specimenType?.trim() || '';
    if (testImage !== existingTest.testImage) data.testImage = testImage;
    if (isPublished !== undefined)
      data.isPublished = isPublished === true || isPublished === 'true';
    if (isActive !== undefined) data.isActive = isActive === true || isActive === 'true';

    // Add test details if provided
    if (normalizedDetails && normalizedDetails.length > 0) {
      data.testDetails = {
        create: normalizedDetails.map(({ turnaround, temperatures, ...detail }) => ({
          ...detail,
          turnaround: toTurnaroundHours(turnaround),
          temperatures: toJsonValue(temperatures),
        })),
      };
    }

    const test = await tx.test.update({
      where: { id },
      data,
      include: {
        category: true,
        testDetails: true,
      },
    });

    return test;
  });

  return updatedTest;
};

const deleteTestFromDB = async (id: string) => {
  const existingTest = await prisma.test.findUnique({ where: { id } });
  if (!existingTest) throw new ApiError(httpStatus.BAD_REQUEST, 'Test not found');

  if (existingTest.testImage) {
    try {
      await deleteFile(existingTest.testImage);
    } catch (error) {
      console.error('Failed to delete test image from storage:', error);
    }
  }

  const deleted = await prisma.test.delete({ where: { id } });
  return deleted;
};

export const TestServices = {
  getTestsDB,
  getTestByIdDB,
  createTestInDB,
  updateTestInDB,
  deleteTestFromDB,
};
