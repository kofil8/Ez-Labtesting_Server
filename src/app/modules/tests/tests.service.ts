import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import ApiError from '../../errors/ApiErrors';
import { deleteFile } from '../../helpers/fileUploadHelper';
import { calculatePagination } from '../../utils/calculatePagination';
import pickValidFields from '../../utils/pickValidFields';

type TestDetailInput = {
  turnaround?: number | string;
  specimenType: string;
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
  description?: string | null;
  testImage?: string | null;
  testDetails?: TestDetailInput | TestDetailInput[];
};

const toNumber = (value: number | string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
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
            specimenType: '',
            component: '',
            method: '',
            cptCode: '',
            testingLocatiion: '',
            turnaround: undefined,
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
    .filter(
      (d) => !!d.specimenType && !!d.component && !!d.method && !!d.cptCode && !!d.testingLocatiion,
    );
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
  searchTerm?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  testCode?: string;
  testName?: string;
  description?: string;
};

const getTestsDB = async (query: GetTestsQuery = {}) => {
  const { searchTerm, minPrice, maxPrice, ...rest } = query;
  const pagination = calculatePagination({
    ...rest,
    page: toNumber(rest.page),
    limit: toNumber(rest.limit),
  });

  const filters = pickValidFields(rest, ['testCode', 'testName', 'description']);

  const andConditions: Prisma.TestWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: searchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' },
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
      testImage: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      testDetails: {
        select: {
          id: true,
          testId: true,
          turnaround: true,
          specimenType: true,
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

  const total = await prisma.test.count({ where });

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
      price: true,
      testImage: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      testDetails: {
        select: {
          id: true,
          testId: true,
          turnaround: true,
          specimenType: true,
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

  const { testDetails, price, ...rest } = parsedPayload;
  const normalizedDetails = normalizeTestDetails(testDetails);

  const newTest = await prisma.test.create({
    data: {
      ...rest,
      price: toNumber(price) ?? 0,
      testImage,
      testDetails: normalizedDetails.length
        ? {
            create: normalizedDetails.map(({ turnaround, temperatures, ...detail }) => ({
              ...detail,
              turnaround: toNumber(turnaround) ?? 0,
              temperatures: toJsonValue(temperatures),
            })),
          }
        : undefined,
    },
    include: {
      testDetails: true,
    },
  });

  return newTest;
};

const updateTestInDB = async (id: string, payload: any, file: any) => {
  const existingTest = await prisma.test.findUnique({ where: { id } });
  if (!existingTest) throw new ApiError(httpStatus.BAD_REQUEST, 'Test not found');
  let testImage = existingTest.testImage;

  // If new file is uploaded, use new file URL
  if (file && file.location) {
    if (existingTest.testImage) {
      try {
        await deleteFile(existingTest.testImage);
      } catch (error) {
        console.error('Failed to delete old test image:', error);
      }
    }

    testImage = file.location;
  }

  const rawPayload = typeof payload === 'string' ? JSON.parse(payload) : payload ?? {};
  const parsedPayload: Partial<CreateTestPayload> = rawPayload;
  const { testDetails, price, ...rest } = parsedPayload as Partial<CreateTestPayload>;
  const hasDetails = typeof testDetails !== 'undefined';
  const normalizedDetails = hasDetails ? normalizeTestDetails(testDetails as any) : undefined;

  const updatedTest = await prisma.$transaction(async (tx) => {
    if (hasDetails) {
      await tx.testDetail.deleteMany({ where: { testId: id } });
    }

    const data: Prisma.TestUpdateInput = {};

    if (rest.testCode !== undefined) data.testCode = rest.testCode as string;
    if (rest.testName !== undefined) data.testName = rest.testName as string;
    if (rest.description !== undefined) data.description = rest.description as string | null;
    if (price !== undefined) data.price = toNumber(price) ?? existingTest.price;
    if (testImage !== existingTest.testImage) data.testImage = testImage as string | null;

    if (normalizedDetails && normalizedDetails.length) {
      data.testDetails = {
        create: normalizedDetails.map(({ turnaround, temperatures, ...detail }) => ({
          ...detail,
          turnaround: toNumber(turnaround) ?? 0,
          temperatures: toJsonValue(temperatures),
        })),
      } as any;
    }

    const test = await tx.test.update({
      where: { id },
      data,
      include: {
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
