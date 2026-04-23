import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import ApiError from '../../errors/ApiErrors';

type LaboratoryPayload = {
  name?: string;
  displayName?: string | null;
  code?: string;
  apiEndpoint?: string | null;
  apiKeyEncrypted?: string | null;
  integrationType?: string | null;
  supportsRealtimeSubmission?: boolean | string;
  supportsResultsRetrieval?: boolean | string;
  isActive?: boolean | string;
  isVisibleToCustomers?: boolean | string;
  sortOrder?: number | string;
  notes?: string | null;
};

type GetLaboratoriesQuery = {
  page?: number | string;
  limit?: number | string;
  search?: string;
  isActive?: boolean | string;
  isVisibleToCustomers?: boolean | string;
  sortBy?: 'name' | 'code' | 'sortOrder' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

class LaboratoryService {
  private parsePositiveInt(value: number | string | undefined, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }

    return Math.trunc(parsed);
  }

  private parseNonNegativeInt(value: number | string | undefined, fieldName: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `${fieldName} must be a non-negative integer`,
      );
    }

    return parsed;
  }

  private parseBoolean(value: boolean | string | undefined) {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  }

  private normalizeRequiredString(value: string | undefined, fieldName: string) {
    const normalized = value?.trim().replace(/\s+/g, ' ');

    if (!normalized) {
      throw new ApiError(httpStatus.BAD_REQUEST, `${fieldName} is required`);
    }

    return normalized;
  }

  private normalizeOptionalString(value: string | null | undefined) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const normalized = value.trim().replace(/\s+/g, ' ');
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeCode(value: string | undefined) {
    return this.normalizeRequiredString(value, 'Laboratory code').toUpperCase();
  }

  async getLaboratories(query: GetLaboratoriesQuery) {
    const page = this.parsePositiveInt(query.page, 1);
    const rawLimit = this.parsePositiveInt(query.limit, 10);
    const limit = Math.min(rawLimit, 100);
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const isActive = this.parseBoolean(query.isActive);
    const isVisibleToCustomers = this.parseBoolean(query.isVisibleToCustomers);
    const sortBy = query.sortBy || 'sortOrder';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    const where: Prisma.LaboratoryWhereInput = {
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                displayName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                code: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                integrationType: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(isVisibleToCustomers !== undefined ? { isVisibleToCustomers } : {}),
    };

    const [laboratories, total] = await prisma.$transaction([
      prisma.laboratory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder } as Prisma.LaboratoryOrderByWithRelationInput,
        include: {
          _count: {
            select: {
              labTests: true,
              stateRestrictions: true,
            },
          },
        },
      }),
      prisma.laboratory.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: laboratories,
    };
  }

  async getLaboratoryById(laboratoryId: string) {
    return prisma.laboratory.findUnique({
      where: { id: laboratoryId },
      include: {
        _count: {
          select: {
            labTests: true,
            stateRestrictions: true,
          },
        },
      },
    });
  }

  async createLaboratory(payload: LaboratoryPayload) {
    const data: Prisma.LaboratoryCreateInput = {
      name: this.normalizeRequiredString(payload.name, 'Laboratory name'),
      code: this.normalizeCode(payload.code),
      displayName: this.normalizeOptionalString(payload.displayName),
      apiEndpoint: this.normalizeOptionalString(payload.apiEndpoint),
      apiKeyEncrypted: this.normalizeOptionalString(payload.apiKeyEncrypted),
      integrationType: this.normalizeOptionalString(payload.integrationType),
      supportsRealtimeSubmission: this.parseBoolean(payload.supportsRealtimeSubmission) ?? false,
      supportsResultsRetrieval: this.parseBoolean(payload.supportsResultsRetrieval) ?? false,
      isActive: this.parseBoolean(payload.isActive) ?? true,
      isVisibleToCustomers: this.parseBoolean(payload.isVisibleToCustomers) ?? true,
      sortOrder:
        payload.sortOrder !== undefined
          ? this.parseNonNegativeInt(payload.sortOrder, 'Sort order')
          : 0,
      notes: this.normalizeOptionalString(payload.notes),
    };

    try {
      return await prisma.laboratory.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiError(httpStatus.CONFLICT, 'Laboratory code already exists');
      }

      throw error;
    }
  }

  async updateLaboratory(laboratoryId: string, payload: LaboratoryPayload) {
    const existingLaboratory = await prisma.laboratory.findUnique({
      where: { id: laboratoryId },
      select: { id: true },
    });

    if (!existingLaboratory) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Laboratory not found');
    }

    const data: Prisma.LaboratoryUpdateInput = {
      ...(payload.name !== undefined && {
        name: this.normalizeRequiredString(payload.name, 'Laboratory name'),
      }),
      ...(payload.code !== undefined && { code: this.normalizeCode(payload.code) }),
      ...(payload.displayName !== undefined && {
        displayName: this.normalizeOptionalString(payload.displayName),
      }),
      ...(payload.apiEndpoint !== undefined && {
        apiEndpoint: this.normalizeOptionalString(payload.apiEndpoint),
      }),
      ...(payload.apiKeyEncrypted !== undefined && {
        apiKeyEncrypted: this.normalizeOptionalString(payload.apiKeyEncrypted),
      }),
      ...(payload.integrationType !== undefined && {
        integrationType: this.normalizeOptionalString(payload.integrationType),
      }),
      ...(payload.supportsRealtimeSubmission !== undefined && {
        supportsRealtimeSubmission:
          this.parseBoolean(payload.supportsRealtimeSubmission) ?? false,
      }),
      ...(payload.supportsResultsRetrieval !== undefined && {
        supportsResultsRetrieval: this.parseBoolean(payload.supportsResultsRetrieval) ?? false,
      }),
      ...(payload.isActive !== undefined && {
        isActive: this.parseBoolean(payload.isActive) ?? false,
      }),
      ...(payload.isVisibleToCustomers !== undefined && {
        isVisibleToCustomers: this.parseBoolean(payload.isVisibleToCustomers) ?? false,
      }),
      ...(payload.sortOrder !== undefined && {
        sortOrder: this.parseNonNegativeInt(payload.sortOrder, 'Sort order'),
      }),
      ...(payload.notes !== undefined && {
        notes: this.normalizeOptionalString(payload.notes),
      }),
    };

    try {
      return await prisma.laboratory.update({
        where: { id: laboratoryId },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiError(httpStatus.CONFLICT, 'Laboratory code already exists');
      }

      throw error;
    }
  }

  async deleteLaboratory(laboratoryId: string) {
    const existingLaboratory = await prisma.laboratory.findUnique({
      where: { id: laboratoryId },
      select: { id: true },
    });

    if (!existingLaboratory) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Laboratory not found');
    }

    return prisma.laboratory.update({
      where: { id: laboratoryId },
      data: {
        isActive: false,
        isVisibleToCustomers: false,
      },
    });
  }
}

export default new LaboratoryService();
