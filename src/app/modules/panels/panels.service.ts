import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import ApiError from '../../errors/ApiErrors';
import { deleteFile } from '../../helpers/fileUploadHelper';
import { calculatePagination } from '../../utils/calculatePagination';

type CreatePanelPayload = {
  name: string;
  description?: string | null;
  panelImage?: string | null;
  basePrice: number | string;
  discountPercent?: number | string;
  isActive?: boolean | string;
  startsAt?: string | null;
  endsAt?: string | null;
  testIds: string[] | string;
};

type UpdatePanelPayload = {
  name?: string;
  description?: string | null;
  basePrice?: number | string;
  discountPercent?: number | string;
  isActive?: boolean | string;
  startsAt?: string | null;
  endsAt?: string | null;
  testIds?: string[] | string;
};

type GetPanelsQuery = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: Prisma.SortOrder;
  search?: string;
  isActive?: string | boolean;
  minPrice?: number | string;
  maxPrice?: number | string;
};

const toNumber = (value: number | string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const normalizeTestIds = (value: string[] | string | undefined) =>
  Array.isArray(value) ? value : value ? [value] : [];

const normalizeBoolean = (value: boolean | string | undefined, fallback?: boolean) => {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (value === 'false') return false;
  if (value === 'true') return true;
  return fallback;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensurePanelCategoryId = async () => {
  const category = await prisma.testCategory.findFirst({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true },
  });

  if (!category) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Create a test category before creating panels');
  }

  return category.id;
};

const ensureComponentTestsExist = async (testIds: string[]) => {
  if (!testIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'At least one component test is required');
  }

  const tests = await prisma.test.findMany({
    where: { id: { in: testIds }, isActive: true, isPanel: false },
    select: { id: true },
  });

  if (tests.length !== testIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more component tests are invalid');
  }
};

const panelSelect = {
  id: true,
  name: true,
  description: true,
  testImageUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  panelComponents: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      sortOrder: true,
      componentTest: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          testImageUrl: true,
          labTests: {
            where: {
              isAvailable: true,
              isVisible: true,
              laboratory: {
                isActive: true,
                isVisibleToCustomers: true,
              },
            },
            orderBy: [{ salePrice: 'asc' as const }, { retailPrice: 'asc' as const }],
            take: 1,
            select: {
              labTestCode: true,
              retailPrice: true,
              salePrice: true,
            },
          },
        },
      },
    },
  },
  labTests: {
    where: {
      isAvailable: true,
      isVisible: true,
      laboratory: {
        isActive: true,
        isVisibleToCustomers: true,
      },
    },
    orderBy: [{ salePrice: 'asc' as const }, { retailPrice: 'asc' as const }],
    take: 1,
    select: {
      retailPrice: true,
      salePrice: true,
    },
  },
} satisfies Prisma.TestSelect;

const formatPanelResponse = (panel: Prisma.TestGetPayload<{ select: typeof panelSelect }>) => {
  const tests = panel.panelComponents.map((item) => {
    const priceSource = item.componentTest.labTests[0];
    const price = Number(priceSource?.salePrice ?? priceSource?.retailPrice ?? 0);

    return {
      id: item.componentTest.id,
      testCode: priceSource?.labTestCode || item.componentTest.slug,
      testName: item.componentTest.name,
      price,
      testImage: item.componentTest.testImageUrl ?? undefined,
      description: item.componentTest.description ?? undefined,
      sortOrder: item.sortOrder,
    };
  });

  const basePrice = Number(
    tests.reduce((sum, test) => sum + (Number.isFinite(test.price) ? test.price : 0), 0),
  );
  const bundlePrice = Number(
    panel.labTests[0]?.salePrice ?? panel.labTests[0]?.retailPrice ?? basePrice,
  );
  const discountPercent =
    basePrice > 0 ? Math.max(0, Number((((basePrice - bundlePrice) / basePrice) * 100).toFixed(2))) : 0;

  return {
    id: panel.id,
    name: panel.name,
    description: panel.description ?? undefined,
    panelImage: panel.testImageUrl ?? null,
    basePrice,
    discountPercent,
    bundlePrice,
    isActive: panel.isActive,
    testsCount: tests.length,
    tests,
    createdAt: panel.createdAt,
    updatedAt: panel.updatedAt,
  };
};

const createPanelInDB = async (payload: CreatePanelPayload, file?: Express.Multer.File) => {
  const testIds = normalizeTestIds(payload.testIds);
  await ensureComponentTestsExist(testIds);

  const name = payload.name.trim();
  if (!name) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Panel name is required');
  }

  const categoryId = await ensurePanelCategoryId();
  const baseSlug = slugify(name) || `panel-${Date.now()}`;
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const created = await prisma.$transaction(async (tx) => {
    const panel = await tx.test.create({
      data: {
        name,
        slug,
        description: payload.description ?? null,
        testImageUrl: file ? (file as any).location : null,
        categoryId,
        isPanel: true,
        isActive: normalizeBoolean(payload.isActive, true) ?? true,
      },
      select: { id: true },
    });

    await tx.testComponent.createMany({
      data: testIds.map((testId, index) => ({
        panelId: panel.id,
        componentTestId: testId,
        sortOrder: index,
      })),
    });

    return tx.test.findUniqueOrThrow({
      where: { id: panel.id },
      select: panelSelect,
    });
  });

  return formatPanelResponse(created);
};

const getPanelsDB = async (query: GetPanelsQuery = {}) => {
  const pagination = calculatePagination({
    page: toNumber(query.page),
    limit: toNumber(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  const where: Prisma.TestWhereInput = {
    isPanel: true,
  };

  if (query.search?.trim()) {
    where.OR = [
      { name: { contains: query.search.trim(), mode: 'insensitive' } },
      { description: { contains: query.search.trim(), mode: 'insensitive' } },
    ];
  }

  if (query.isActive !== undefined) {
    where.isActive = normalizeBoolean(query.isActive, true);
  }

  const [panels, total] = await Promise.all([
    prisma.test.findMany({
      where,
      select: panelSelect,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
    }),
    prisma.test.count({ where }),
  ]);

  const formattedPanels = panels.map(formatPanelResponse).filter((panel) => {
    const minPrice = toNumber(query.minPrice);
    const maxPrice = toNumber(query.maxPrice);
    if (minPrice !== undefined && panel.bundlePrice < minPrice) return false;
    if (maxPrice !== undefined && panel.bundlePrice > maxPrice) return false;
    return true;
  });

  return {
    data: formattedPanels,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
    },
  };
};

const getPanelByIdDB = async (panelId: string) => {
  const panel = await prisma.test.findFirst({
    where: {
      id: panelId,
      isPanel: true,
    },
    select: panelSelect,
  });

  if (!panel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Panel not found');
  }

  return formatPanelResponse(panel);
};

const updatePanelInDB = async (
  panelId: string,
  payload: UpdatePanelPayload,
  file?: Express.Multer.File,
) => {
  const existingPanel = await prisma.test.findFirst({
    where: { id: panelId, isPanel: true },
    select: { id: true, testImageUrl: true },
  });

  if (!existingPanel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Panel not found');
  }

  if (file && existingPanel.testImageUrl) {
    try {
      await deleteFile(existingPanel.testImageUrl);
    } catch {}
  }

  const testIds = payload.testIds ? normalizeTestIds(payload.testIds) : undefined;
  if (testIds) {
    await ensureComponentTestsExist(testIds);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.test.update({
      where: { id: panelId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
        ...(payload.description !== undefined ? { description: payload.description ?? null } : {}),
        ...(payload.isActive !== undefined
          ? { isActive: normalizeBoolean(payload.isActive, true) ?? true }
          : {}),
        ...(file ? { testImageUrl: (file as any).location } : {}),
      },
    });

    if (testIds) {
      await tx.testComponent.deleteMany({ where: { panelId } });
      await tx.testComponent.createMany({
        data: testIds.map((testId, index) => ({
          panelId,
          componentTestId: testId,
          sortOrder: index,
        })),
      });
    }

    return tx.test.findUniqueOrThrow({
      where: { id: panelId },
      select: panelSelect,
    });
  });

  return formatPanelResponse(updated);
};

const deletePanelFromDB = async (panelId: string) => {
  const existingPanel = await prisma.test.findFirst({
    where: { id: panelId, isPanel: true },
    select: {
      id: true,
      name: true,
      slug: true,
      testImageUrl: true,
      categoryId: true,
      shortDescription: true,
      createdAt: true,
      _count: {
        select: {
          cartItems: true,
          orderItems: true,
          componentOfPanels: true,
        },
      },
    },
  });

  if (!existingPanel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Panel not found');
  }

  if (existingPanel.testImageUrl) {
    try {
      await deleteFile(existingPanel.testImageUrl);
    } catch {}
  }

  if (
    existingPanel._count.cartItems > 0 ||
    existingPanel._count.orderItems > 0 ||
    existingPanel._count.componentOfPanels > 0
  ) {
    await prisma.test.update({
      where: { id: panelId },
      data: { isActive: false },
    });

    return {
      id: existingPanel.id,
      name: existingPanel.name,
      slug: existingPanel.slug,
      categoryId: existingPanel.categoryId,
      shortDescription: existingPanel.shortDescription,
      testImageUrl: existingPanel.testImageUrl,
      deletedAt: new Date(),
      mode: 'soft-delete',
    };
  }

  const deleted = await prisma.test.delete({ where: { id: panelId } });

  return {
    id: deleted.id,
    name: deleted.name,
    slug: deleted.slug,
    categoryId: deleted.categoryId,
    shortDescription: deleted.shortDescription,
    testImageUrl: deleted.testImageUrl,
    deletedAt: new Date(),
    createdAt: deleted.createdAt,
    mode: 'hard-delete',
  };
};

export const PanelServices = {
  createPanelInDB,
  getPanelsDB,
  getPanelByIdDB,
  updatePanelInDB,
  deletePanelFromDB,
};
