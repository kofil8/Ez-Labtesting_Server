import { PaymentStatus, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import ApiError from '../../errors/ApiErrors';
import { deleteFile } from '../../helpers/fileUploadHelper';

type TestPayload = {
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  specimenType?: string;
  baseTurnaroundDays?: number;
  isPanel?: boolean;
  cptCode?: string[] | string;
  preparationInstructions?: string;
  preperationInstructions?: string; // backward compatibility
  internalNotes?: string;
  interalNotes?: string; // backward compatibility
  seoTitle?: string;
  seoDescription?: string;
  searchKeywords?: string[];
  requiresFasting?: boolean;
  minAge?: number;
  maxAge?: number;
  isActive?: boolean;
  isPopular?: boolean;
  removeTestImage?: boolean;
  componentTestIds?: string[];
};

interface IGetTestsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  categoryId?: string;
  isPanel?: boolean;
  requiresFasting?: boolean;
  isPopular?: boolean;
  minAge?: number;
  maxAge?: number;
  isActive?: 'true' | 'false' | 'all' | boolean;
}

function sanitizeTestImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace('/uplloads/', '/uploads/');
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeOptionalString = (value?: string | null) => {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeOptionalStringArray = (value?: string[] | string) => {
  if (value === undefined) return undefined;

  const values = Array.isArray(value)
    ? value
    : value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  return values;
};

const parseIntegerQuery = (value: unknown, fallback?: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const parseBooleanQuery = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return undefined;
};

const parseStringQuery = (value: unknown) => {
  if (typeof value === 'string') return value;
  return undefined;
};

const getEffectivePreparationInstructions = (payload: TestPayload) =>
  payload.preparationInstructions ?? payload.preperationInstructions;

const getEffectiveInternalNotes = (payload: TestPayload) =>
  payload.internalNotes ?? payload.interalNotes;

const buildTestIdentifierWhere = (identifier: string): Prisma.TestWhereInput => {
  const trimmedIdentifier = identifier.trim();

  if (UUID_REGEX.test(trimmedIdentifier)) {
    return {
      OR: [{ id: trimmedIdentifier }, { slug: trimmedIdentifier }],
    };
  }

  return {
    slug: trimmedIdentifier,
  };
};

const validateCategoryExists = async (categoryId: string) => {
  const categoryExists = await prisma.testCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!categoryExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Category with ID "${categoryId}" not found`);
  }
};

const validateUniqueName = async (name: string, excludeId?: string) => {
  const existing = await prisma.test.findFirst({
    where: {
      name: name.trim(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, `A test with name "${name.trim()}" already exists`);
  }
};

const validateUniqueSlug = async (slug: string, excludeId?: string) => {
  const existing = await prisma.test.findFirst({
    where: {
      slug: slug.trim(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, `A test with slug "${slug.trim()}" already exists`);
  }
};

const validatePanelComponents = async (panelId: string | null, componentTestIds: string[]) => {
  const uniqueComponentIds = [...new Set(componentTestIds)];

  if (uniqueComponentIds.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Panel test must include at least one component test',
    );
  }

  if (panelId && uniqueComponentIds.includes(panelId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A panel cannot contain itself as a component');
  }

  const components = await prisma.test.findMany({
    where: {
      id: { in: uniqueComponentIds },
      isActive: true,
    },
    select: {
      id: true,
      isPanel: true,
      name: true,
    },
  });

  if (components.length !== uniqueComponentIds.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'One or more component tests are invalid or inactive',
    );
  }

  const nestedPanel = components.find((item) => item.isPanel);
  if (nestedPanel) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Nested panels are not allowed. "${nestedPanel.name}" is already a panel.`,
    );
  }

  return uniqueComponentIds;
};

const buildPublicLabTestWhere = (): Prisma.LabTestWhereInput => ({
  isAvailable: true,
  isVisible: true,
  laboratory: {
    isActive: true,
    isVisibleToCustomers: true,
  },
});

const createTestInDB = async (payload: TestPayload, file?: Express.Multer.File) => {
  const testImage = sanitizeTestImageUrl(file?.location);

  if (!payload.name?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Test name is required');
  }

  if (!payload.slug?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Test slug is required');
  }

  if (!payload.categoryId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Category ID is required');
  }

  await validateCategoryExists(payload.categoryId);
  await validateUniqueName(payload.name);
  await validateUniqueSlug(payload.slug);

  const isPanel = payload.isPanel ?? false;
  const componentTestIds = payload.componentTestIds ?? [];

  if (isPanel) {
    await validatePanelComponents(null, componentTestIds);
  } else if (componentTestIds.length > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only panel tests can have component tests');
  }

  const preparationInstructions = getEffectivePreparationInstructions(payload);
  const internalNotes = getEffectiveInternalNotes(payload);

  const created = await prisma.$transaction(async (tx) => {
    const newTest = await tx.test.create({
      data: {
        name: payload.name!.trim(),
        slug: payload.slug!.trim(),
        description: normalizeOptionalString(payload.description),
        shortDescription: normalizeOptionalString(payload.shortDescription),
        category: { connect: { id: payload.categoryId! } },
        specimenType: normalizeOptionalString(payload.specimenType),
        cptCode: normalizeOptionalStringArray(payload.cptCode) ?? [],
        testImageUrl: testImage,
        baseTurnaroundDays: payload.baseTurnaroundDays ?? null,
        isPanel,
        preparationInstructions: normalizeOptionalString(preparationInstructions),
        internalNotes: normalizeOptionalString(internalNotes),
        seoTitle: normalizeOptionalString(payload.seoTitle),
        seoDescription: normalizeOptionalString(payload.seoDescription),
        searchKeywords: payload.searchKeywords ?? [],
        requiresFasting: payload.requiresFasting ?? false,
        minAge: payload.minAge ?? null,
        maxAge: payload.maxAge ?? null,
        isActive: payload.isActive ?? true,
        isPopular: payload.isPopular ?? false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (isPanel && componentTestIds.length > 0) {
      const uniqueComponentIds = [...new Set(componentTestIds)];

      await tx.testComponent.createMany({
        data: uniqueComponentIds.map((componentTestId, index) => ({
          panelId: newTest.id,
          componentTestId,
          sortOrder: index,
        })),
      });
    }

    return newTest;
  });

  return {
    id: created.id,
    cptCode: created.cptCode,
    name: created.name,
    slug: created.slug,
    categoryId: created.categoryId,
    testImageUrl: sanitizeTestImageUrl(created.testImageUrl),
    shortDescription: created.shortDescription,
    isPanel: created.isPanel,
    isActive: created.isActive,
    isPopular: created.isPopular,
    createdAt: created.createdAt,
  };
};

const getTestsDB = async (query: IGetTestsQuery = {}) => {
  const page = Math.max(1, parseIntegerQuery(query.page, 1) || 1);
  const limit = Math.max(1, parseIntegerQuery(query.limit, 10) || 10);
  const sortBy = parseStringQuery(query.sortBy) || 'createdAt';
  const sortOrder = parseStringQuery(query.sortOrder) || 'desc';
  const search = parseStringQuery(query.search);
  const categoryId = parseStringQuery(query.categoryId);
  const isPanel = parseBooleanQuery(query.isPanel);
  const requiresFasting = parseBooleanQuery(query.requiresFasting);
  const isPopular = parseBooleanQuery(query.isPopular);
  const minAge = parseIntegerQuery(query.minAge);
  const maxAge = parseIntegerQuery(query.maxAge);
  const skip = (page - 1) * limit;

  // isActive filter: default to true. Allow explicit `false` or `all` overrides.
  const isActiveRaw = query.isActive;
  const where: Prisma.TestWhereInput = {};
  if (isActiveRaw === 'all') {
    // no filter on isActive
  } else if (isActiveRaw === 'false' || isActiveRaw === false) {
    where.isActive = false;
  } else if (isActiveRaw === 'true' || isActiveRaw === true || isActiveRaw === undefined) {
    where.isActive = true;
  } else {
    where.isActive = true;
  }

  if (search && search.trim()) {
    const keywords = search
      .trim()
      .split(/\s+/)
      .filter((k) => k.length > 0);

    if (keywords.length > 0) {
      // For each keyword, search across all fields and combine with OR
      // This allows "cbc lipid a1c physical" to return tests matching ANY of these keywords
      where.OR = keywords.flatMap((keyword) => [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { shortDescription: { contains: keyword, mode: 'insensitive' } },
        { cptCode: { has: keyword } },
        { searchKeywords: { hasSome: [keyword] } },
      ]);
    }
  }

  if (categoryId) where.categoryId = categoryId;
  if (isPanel !== undefined) where.isPanel = isPanel;
  if (requiresFasting !== undefined) where.requiresFasting = requiresFasting;
  if (isPopular !== undefined) where.isPopular = isPopular;

  if (minAge !== undefined || maxAge !== undefined) {
    const andConditions: Prisma.TestWhereInput[] = [];

    if (minAge !== undefined) {
      andConditions.push({
        OR: [{ minAge: null }, { minAge: { lte: minAge } }],
      });
    }

    if (maxAge !== undefined) {
      andConditions.push({
        OR: [{ maxAge: null }, { maxAge: { gte: maxAge } }],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
  }

  const validSortFields = [
    'name',
    'createdAt',
    'updatedAt',
    'isPopular',
    'baseTurnaroundDays',
    'orderCount',
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
  const orderBy: Prisma.TestOrderByWithRelationInput =
    sortField === 'orderCount' ? { orderItems: { _count: order } } : { [sortField]: order };

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        testImageUrl: true,
        categoryId: true,
        description: true,
        shortDescription: true,
        specimenType: true,
        baseTurnaroundDays: true,
        cptCode: true,
        preparationInstructions: true,
        internalNotes: true,
        seoTitle: true,
        seoDescription: true,
        searchKeywords: true,
        isActive: true,
        isPopular: true,
        isPanel: true,
        requiresFasting: true,
        minAge: true,
        maxAge: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        panelComponents: {
          select: {
            id: true,
            componentTest: {
              select: {
                isActive: true,
              },
            },
          },
        },
        labTests: {
          where: buildPublicLabTestWhere(),
          orderBy: { retailPrice: 'asc' },
          select: {
            id: true,
            retailPrice: true,
            labCost: true,
            labTestCode: true,
            turnaroundDaysOverride: true,
            laboratory: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: {
              where: {
                order: {
                  paymentStatus: PaymentStatus.SUCCEEDED,
                },
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.test.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const sanitizedTests = tests.map((test) => {
    const accessLabTest = test.labTests.find(
      (labTest) => labTest.laboratory.code.toUpperCase() === 'ACCESS',
    );

    return {
      ...test,
      testImageUrl: sanitizeTestImageUrl(test.testImageUrl),
      componentCount: test.panelComponents.filter((item) => item.componentTest.isActive).length,
      accessLabTestId: accessLabTest?.id ?? null,
      startingLabTestId: test.labTests[0]?.id ?? null,
      startingPrice: test.labTests[0]?.retailPrice ?? null,
      startingLab: test.labTests[0]?.laboratory ?? null,
      turnaroundDays: test.labTests[0]?.turnaroundDaysOverride ?? test.baseTurnaroundDays ?? null,
      totalOrders: test._count.orderItems,
      soldCount: test._count.orderItems,
      panelComponents: undefined,
      labTests: undefined,
      _count: undefined,
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      sortBy: sortField,
      sortOrder: order,
    },
    data: sanitizedTests,
  };
};

const getTestByIdDB = async (identifier: string) => {
  const test = await prisma.test.findFirst({
    where: buildTestIdentifierWhere(identifier),
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      description: true,
      specimenType: true,
      cptCode: true,
      setUpSchedule: true,
      testImageUrl: true,
      baseTurnaroundDays: true,
      isPanel: true,
      preparationInstructions: true,
      internalNotes: true,
      seoTitle: true,
      seoDescription: true,
      searchKeywords: true,
      requiresFasting: true,
      minAge: true,
      maxAge: true,
      isActive: true,
      isPopular: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      panelComponents: {
        orderBy: {
          sortOrder: 'asc',
        },
        select: {
          id: true,
          sortOrder: true,
          componentTest: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortDescription: true,
              specimenType: true,
              baseTurnaroundDays: true,
              cptCode: true,
              testImageUrl: true,
              isPanel: true,
              isActive: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      labTests: {
        where: buildPublicLabTestWhere(),
        orderBy: { retailPrice: 'asc' },
        select: {
          id: true,
          labTestCode: true,
          retailPrice: true,
          labCost: true,
          turnaroundDaysOverride: true,
          laboratory: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  if (!test || !test.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
  }

  const components = test.panelComponents
    .filter((item) => item.componentTest.isActive)
    .map((item) => ({
      id: item.componentTest.id,
      name: item.componentTest.name,
      slug: item.componentTest.slug,
      shortDescription: item.componentTest.shortDescription,
      specimenType: item.componentTest.specimenType,
      baseTurnaroundDays: item.componentTest.baseTurnaroundDays,
      cptCode: item.componentTest.cptCode,
      testImageUrl: sanitizeTestImageUrl(item.componentTest.testImageUrl),
      isPanel: item.componentTest.isPanel,
      category: item.componentTest.category,
      sortOrder: item.sortOrder,
    }));

  const labOptions = test.labTests.map((labTest) => ({
    id: labTest.id,
    labTestCode: labTest.labTestCode,
    retailPrice: labTest.retailPrice,
    labCost: labTest.labCost,
    turnaroundDays: labTest.turnaroundDaysOverride ?? test.baseTurnaroundDays ?? null,
    laboratory: labTest.laboratory,
  }));

  return {
    ...test,
    testImageUrl: sanitizeTestImageUrl(test.testImageUrl),
    panelComponents: undefined,
    labTests: undefined,
    components,
    componentCount: components.length,
    labOptions,
    startingPrice: labOptions[0]?.retailPrice ?? null,
  };
};

const getPanelComponentsDB = async (identifier: string) => {
  const test = await prisma.test.findFirst({
    where: buildTestIdentifierWhere(identifier),
    select: {
      id: true,
      name: true,
      isPanel: true,
      panelComponents: {
        orderBy: {
          sortOrder: 'asc',
        },
        select: {
          id: true,
          sortOrder: true,
          componentTest: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortDescription: true,
              specimenType: true,
              baseTurnaroundDays: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!test) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
  }

  if (!test.isPanel) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This test is not a panel');
  }

  return {
    id: test.id,
    name: test.name,
    isPanel: test.isPanel,
    componentCount: test.panelComponents.filter((item) => item.componentTest.isActive).length,
    components: test.panelComponents
      .filter((item) => item.componentTest.isActive)
      .map((item) => ({
        id: item.componentTest.id,
        name: item.componentTest.name,
        slug: item.componentTest.slug,
        shortDescription: item.componentTest.shortDescription,
        specimenType: item.componentTest.specimenType,
        baseTurnaroundDays: item.componentTest.baseTurnaroundDays,
        isActive: item.componentTest.isActive,
        sortOrder: item.sortOrder,
      })),
  };
};

const updatePanelComponentsInDB = async (testId: string, componentTestIds: string[]) => {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: {
      id: true,
      isPanel: true,
      name: true,
    },
  });

  if (!test) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
  }

  if (!test.isPanel) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only panel tests can have components');
  }

  const uniqueComponentIds = await validatePanelComponents(testId, componentTestIds);

  await prisma.$transaction(async (tx) => {
    await tx.testComponent.deleteMany({
      where: { panelId: testId },
    });

    await tx.testComponent.createMany({
      data: uniqueComponentIds.map((componentTestId, index) => ({
        panelId: testId,
        componentTestId,
        sortOrder: index,
      })),
    });
  });

  return getPanelComponentsDB(testId);
};

const updateTestInDB = async (id: string, payload: TestPayload, file?: Express.Multer.File) => {
  const existingTest = await prisma.test.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      isPanel: true,
      testImageUrl: true,
      categoryId: true,
    },
  });

  if (!existingTest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
  }

  if (payload.categoryId !== undefined) {
    await validateCategoryExists(payload.categoryId);
  }

  if (payload.slug !== undefined && payload.slug.trim() !== existingTest.slug) {
    await validateUniqueSlug(payload.slug, id);
  }

  if (payload.name !== undefined && payload.name.trim() !== existingTest.name) {
    await validateUniqueName(payload.name, id);
  }

  let testImage = sanitizeTestImageUrl(existingTest.testImageUrl);

  if (payload.removeTestImage && existingTest.testImageUrl && !file?.location) {
    try {
      await deleteFile(existingTest.testImageUrl);
    } catch (error) {
      console.error('Failed to delete test image:', error);
    }
    testImage = null;
  }

  if (file?.location) {
    if (existingTest.testImageUrl) {
      try {
        await deleteFile(existingTest.testImageUrl);
      } catch (error) {
        console.error('Failed to delete old test image:', error);
      }
    }
    testImage = sanitizeTestImageUrl(file.location);
  }

  const nextIsPanel = payload.isPanel ?? existingTest.isPanel;
  const incomingComponentIds = payload.componentTestIds;

  if (nextIsPanel && incomingComponentIds !== undefined) {
    await validatePanelComponents(id, incomingComponentIds);
  }

  if (!nextIsPanel && incomingComponentIds?.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only panel tests can have component tests');
  }

  const preparationInstructions = getEffectivePreparationInstructions(payload);
  const internalNotes = getEffectiveInternalNotes(payload);

  const updatedTest = await prisma.$transaction(async (tx) => {
    const data: Prisma.TestUpdateInput = {};

    if (payload.name !== undefined) data.name = payload.name.trim();
    if (payload.slug !== undefined) data.slug = payload.slug.trim();
    if (payload.description !== undefined) {
      data.description = normalizeOptionalString(payload.description);
    }
    if (payload.shortDescription !== undefined) {
      data.shortDescription = normalizeOptionalString(payload.shortDescription);
    }
    if (payload.categoryId !== undefined) {
      data.category = { connect: { id: payload.categoryId } };
    }
    if (payload.specimenType !== undefined) {
      data.specimenType = normalizeOptionalString(payload.specimenType);
    }
    if (payload.cptCode !== undefined) {
      data.cptCode = normalizeOptionalStringArray(payload.cptCode) ?? [];
    }
    if (payload.baseTurnaroundDays !== undefined) {
      data.baseTurnaroundDays = payload.baseTurnaroundDays;
    }
    if (payload.isPanel !== undefined) {
      data.isPanel = payload.isPanel;
    }
    if (preparationInstructions !== undefined) {
      data.preparationInstructions = normalizeOptionalString(preparationInstructions);
    }
    if (internalNotes !== undefined) {
      data.internalNotes = normalizeOptionalString(internalNotes);
    }
    if (payload.seoTitle !== undefined) {
      data.seoTitle = normalizeOptionalString(payload.seoTitle);
    }
    if (payload.seoDescription !== undefined) {
      data.seoDescription = normalizeOptionalString(payload.seoDescription);
    }
    if (payload.searchKeywords !== undefined) {
      data.searchKeywords = payload.searchKeywords;
    }
    if (payload.requiresFasting !== undefined) {
      data.requiresFasting = payload.requiresFasting;
    }
    if (payload.minAge !== undefined) {
      data.minAge = payload.minAge;
    }
    if (payload.maxAge !== undefined) {
      data.maxAge = payload.maxAge;
    }
    if (payload.isActive !== undefined) {
      data.isActive = payload.isActive;
    }
    if (payload.isPopular !== undefined) {
      data.isPopular = payload.isPopular;
    }
    if (testImage !== existingTest.testImageUrl) {
      data.testImageUrl = testImage;
    }

    const updated = await tx.test.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // if test is being changed from panel -> non-panel, remove components
    if (payload.isPanel === false) {
      await tx.testComponent.deleteMany({
        where: { panelId: id },
      });
    }

    // if explicit component list passed, sync it
    if (nextIsPanel && incomingComponentIds !== undefined) {
      const uniqueComponentIds = [...new Set(incomingComponentIds)];

      await tx.testComponent.deleteMany({
        where: { panelId: id },
      });

      await tx.testComponent.createMany({
        data: uniqueComponentIds.map((componentTestId, index) => ({
          panelId: id,
          componentTestId,
          sortOrder: index,
        })),
      });
    }

    return updated;
  });

  return {
    id: updatedTest.id,
    name: updatedTest.name,
    slug: updatedTest.slug,
    cptCode: updatedTest.cptCode,
    categoryId: updatedTest.categoryId,
    category: updatedTest.category,
    testImageUrl: sanitizeTestImageUrl(updatedTest.testImageUrl),
    shortDescription: updatedTest.shortDescription,
    isPanel: updatedTest.isPanel,
    isActive: updatedTest.isActive,
    isPopular: updatedTest.isPopular,
    updatedAt: updatedTest.updatedAt,
  };
};

const deleteTestFromDB = async (id: string) => {
  const existingTest = await prisma.test.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      cptCode: true,
      categoryId: true,
      testImageUrl: true,
      shortDescription: true,
      isPanel: true,
      _count: {
        select: {
          cartItems: true,
          orderItems: true,
          componentOfPanels: true,
          panelComponents: true,
        },
      },
    },
  });

  if (!existingTest) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Test not found');
  }

  if (
    existingTest._count.cartItems > 0 ||
    existingTest._count.orderItems > 0 ||
    existingTest._count.componentOfPanels > 0
  ) {
    // soft delete if already used anywhere or part of another panel
    const archived = await prisma.test.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return {
      id: archived.id,
      name: archived.name,
      slug: archived.slug,
      cptCode: archived.cptCode,
      categoryId: archived.categoryId,
      testImageUrl: sanitizeTestImageUrl(archived.testImageUrl),
      shortDescription: archived.shortDescription,
      isActive: archived.isActive,
      deletedAt: new Date(),
      mode: 'soft-delete',
    };
  }

  if (existingTest.testImageUrl) {
    try {
      await deleteFile(existingTest.testImageUrl);
    } catch (error) {
      console.error('Failed to delete test image from storage:', error);
    }
  }

  const deleted = await prisma.test.delete({ where: { id } });

  return {
    id: deleted.id,
    name: deleted.name,
    slug: deleted.slug,
    cptCode: deleted.cptCode,
    categoryId: deleted.categoryId,
    testImageUrl: sanitizeTestImageUrl(deleted.testImageUrl),
    shortDescription: deleted.shortDescription,
    deletedAt: new Date(),
    createdAt: deleted.createdAt,
    mode: 'hard-delete',
  };
};

export const TestServices = {
  getTestsDB,
  getTestByIdDB,
  getPanelComponentsDB,
  updatePanelComponentsInDB,
  createTestInDB,
  updateTestInDB,
  deleteTestFromDB,
};
