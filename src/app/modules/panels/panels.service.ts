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
  searchTerm?: string;
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

const searchableFields: Array<keyof Prisma.TestPanelWhereInput> = ['name', 'description'];

// ✅ CREATE PANEL WITH TESTS
const createPanelInDB = async (payload: CreatePanelPayload, file?: Express.Multer.File) => {
  // Coerce types coming from multipart FormData (all fields arrive as strings)
  const testIds = Array.isArray(payload.testIds)
    ? payload.testIds
    : typeof payload.testIds === 'string'
      ? [payload.testIds]
      : [];
  const basePrice = Number(payload.basePrice);
  const discountPercent =
    payload.discountPercent !== undefined ? Number(payload.discountPercent) : 0;
  const isActive =
    payload.isActive === undefined
      ? true
      : payload.isActive === 'false' || payload.isActive === false
        ? false
        : Boolean(payload.isActive);

  const panelName = (payload.name ?? '').toString().trim();
  if (!panelName) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Panel name is required');
  }

  if (isNaN(basePrice) || basePrice <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'basePrice must be a positive number');
  }

  // Verify all tests exist
  const testsCount = await prisma.test.count({
    where: { id: { in: testIds } },
  });

  if (testsCount !== testIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more test IDs do not exist');
  }

  const panelImage = file ? (file as any).location : null;

  // Create panel with tests
  const panel = await prisma.testPanel.create({
    data: {
      name: panelName,
      description: payload.description,
      panelImage,
      basePrice,
      discountPercent,
      isActive,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
      endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
      tests: {
        createMany: {
          data: testIds.map((testId, index) => ({
            testId,
            sortOrder: index,
          })),
        },
      },
    },
    include: {
      tests: {
        include: {
          test: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return formatPanelResponse(panel);
};

// ✅ GET ALL PANELS WITH FILTERS
const getPanelsDB = async (query: GetPanelsQuery = {}) => {
  const { searchTerm, isActive, minPrice, maxPrice, ...rest } = query;

  const pagination = calculatePagination({
    ...rest,
    page: toNumber(rest.page as any),
    limit: toNumber(rest.limit as any),
  });

  const andConditions: Prisma.TestPanelWhereInput[] = [];

  // Search term
  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ] as Prisma.TestPanelWhereInput[],
    });
  }

  // Active status filter
  if (isActive !== undefined) {
    const isActiveBool = isActive === 'true' || isActive === true;
    andConditions.push({ isActive: isActiveBool });
  }

  // Price filters
  const minPriceNum = toNumber(minPrice as any);
  const maxPriceNum = toNumber(maxPrice as any);

  if (minPriceNum !== undefined) {
    andConditions.push({
      basePrice: { gte: minPriceNum },
    });
  }

  if (maxPriceNum !== undefined) {
    andConditions.push({
      basePrice: { lte: maxPriceNum },
    });
  }

  const whereConditions: Prisma.TestPanelWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Get total count
  const total = await prisma.testPanel.count({
    where: whereConditions,
  });

  // Get panels
  const panels = await prisma.testPanel.findMany({
    where: whereConditions,
    include: {
      tests: {
        include: {
          test: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
    skip: pagination.skip,
    take: pagination.limit,
    orderBy: {
      [pagination.sortBy]: pagination.sortOrder,
    },
  });

  const formattedPanels = panels.map((panel) => formatPanelResponse(panel));

  return {
    data: formattedPanels,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
    },
  };
};

// ✅ GET PANEL BY ID
const getPanelByIdDB = async (panelId: string) => {
  const panel = await prisma.testPanel.findUnique({
    where: { id: panelId },
    include: {
      tests: {
        include: {
          test: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!panel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Panel not found');
  }

  return formatPanelResponse(panel);
};

// ✅ UPDATE PANEL
const updatePanelInDB = async (
  panelId: string,
  payload: UpdatePanelPayload,
  file?: Express.Multer.File,
) => {
  // Check panel exists
  const existingPanel = await prisma.testPanel.findUnique({
    where: { id: panelId },
  });

  if (!existingPanel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Panel not found');
  }

  // Handle image replacement
  let panelImage: string | null | undefined = undefined;
  if (file) {
    if (existingPanel.panelImage) {
      try {
        await deleteFile(existingPanel.panelImage);
      } catch (_) {}
    }
    panelImage = (file as any).location;
  }

  // Coerce types coming from multipart FormData
  const testIds = payload.testIds
    ? Array.isArray(payload.testIds)
      ? payload.testIds
      : [payload.testIds as unknown as string]
    : undefined;
  const basePrice = payload.basePrice !== undefined ? Number(payload.basePrice) : undefined;
  const discountPercent =
    payload.discountPercent !== undefined ? Number(payload.discountPercent) : undefined;
  const isActive =
    payload.isActive === undefined
      ? undefined
      : payload.isActive === 'false' || payload.isActive === false
        ? false
        : Boolean(payload.isActive);

  // Validate name if provided
  let nameToSet: string | undefined = undefined;
  if (payload.name !== undefined) {
    const trimmed = (payload.name ?? '').toString().trim();
    if (trimmed.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Panel name cannot be empty');
    }
    nameToSet = trimmed;
  }

  // Verify tests if provided
  if (testIds && testIds.length > 0) {
    const testsCount = await prisma.test.count({
      where: { id: { in: testIds } },
    });

    if (testsCount !== testIds.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'One or more test IDs do not exist');
    }

    // Delete old relationships and create new ones
    await prisma.panelTest.deleteMany({
      where: { panelId },
    });

    await prisma.panelTest.createMany({
      data: testIds.map((testId, index) => ({
        panelId,
        testId,
        sortOrder: index,
      })),
    });
  }

  // Update panel
  const updated = await prisma.testPanel.update({
    where: { id: panelId },
    data: {
      ...(nameToSet !== undefined && { name: nameToSet }),
      ...(payload.description !== undefined && { description: payload.description }),
      ...(panelImage !== undefined && { panelImage }),
      ...(basePrice !== undefined && !isNaN(basePrice) && { basePrice }),
      ...(discountPercent !== undefined && !isNaN(discountPercent) && { discountPercent }),
      ...(isActive !== undefined && { isActive }),
      ...(payload.startsAt !== undefined && {
        startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
      }),
      ...(payload.endsAt !== undefined && {
        endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
      }),
    },
    include: {
      tests: {
        include: {
          test: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return formatPanelResponse(updated);
};

// ✅ DELETE PANEL
const deletePanelFromDB = async (panelId: string) => {
  const panel = await prisma.testPanel.findUnique({
    where: { id: panelId },
  });

  if (!panel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Panel not found');
  }

  // Delete panel image from S3 if present
  if (panel.panelImage) {
    try {
      await deleteFile(panel.panelImage);
    } catch (_) {}
  }

  // Delete panel (cascade will handle panelTest records)
  const deleted = await prisma.testPanel.delete({
    where: { id: panelId },
    include: {
      tests: {
        include: {
          test: true,
        },
      },
    },
  });

  return formatPanelResponse(deleted);
};

// Helper function to format panel response
const formatPanelResponse = (panel: any) => {
  const bundlePrice = panel.basePrice * (1 - panel.discountPercent / 100);

  return {
    id: panel.id,
    name: panel.name,
    description: panel.description,
    panelImage: panel.panelImage ?? null,
    basePrice: panel.basePrice,
    discountPercent: panel.discountPercent,
    bundlePrice: parseFloat(bundlePrice.toFixed(2)),
    isActive: panel.isActive,
    startsAt: panel.startsAt,
    endsAt: panel.endsAt,
    testsCount: panel.tests?.length || 0,
    tests: panel.tests
      ? panel.tests.map((pt: any) => ({
          id: pt.test.id,
          testCode: pt.test.testCode,
          testName: pt.test.testName,
          price: pt.test.price,
          testImage: pt.test.testImage,
          description: pt.test.description,
          sortOrder: pt.sortOrder,
        }))
      : [],
    createdAt: panel.createdAt,
    updatedAt: panel.updatedAt,
  };
};

export const PanelServices = {
  createPanelInDB,
  getPanelsDB,
  getPanelByIdDB,
  updatePanelInDB,
  deletePanelFromDB,
};
