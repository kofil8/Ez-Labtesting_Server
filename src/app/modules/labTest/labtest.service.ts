import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import ApiError from '../../errors/ApiErrors';

type LabTestPayload = {
  testId?: string;
  laboratoryId?: string;
  labTestCode?: string;
  externalTestId?: string | null;
  labCost?: number | string;
  retailPrice?: number | string;
  salePrice?: number | string | null;
  currency?: string;
  isAvailable?: boolean | string;
  isVisible?: boolean | string;
  turnaroundDaysOverride?: number | string | null;
  specimenTypeOverride?: string | null;
  patientInstructionsOverride?: string | null;
  sortOrder?: number | string;
};

type GetLabTestsQuery = {
  page?: number | string;
  limit?: number | string;
  search?: string;
  testId?: string;
  laboratoryId?: string;
  isAvailable?: boolean | string;
  isVisible?: boolean | string;
  sortBy?:
    | 'labTestCode'
    | 'retailPrice'
    | 'salePrice'
    | 'sortOrder'
    | 'createdAt'
    | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

class LabTestService {
  private parsePositiveInt(value: number | string | undefined, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }

    return Math.trunc(parsed);
  }

  private parseNonNegativeInt(value: number | string | undefined, fieldName: string) {
    const parsed = this.parseNumber(value, fieldName);

    if (!Number.isInteger(parsed) || parsed < 0) {
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

  private parseNumber(value: number | string | undefined, fieldName: string) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `${fieldName} must be a valid number`);
    }

    return parsed;
  }

  private parseNullableNumber(value: number | string | null | undefined, fieldName: string) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    return this.parseNumber(value, fieldName);
  }

  private parseNullableInteger(value: number | string | null | undefined, fieldName: string) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    return this.parseNonNegativeInt(value, fieldName);
  }

  private normalizeRequiredString(value: string | undefined, fieldName: string) {
    const normalized = value?.trim();

    if (!normalized) {
      throw new ApiError(httpStatus.BAD_REQUEST, `${fieldName} is required`);
    }

    return normalized;
  }

  private normalizeOptionalString(value: string | null | undefined) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeCurrency(value: string | undefined) {
    if (value === undefined) return undefined;

    const normalized = value.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Currency must be a 3-letter uppercase code such as USD',
      );
    }

    return normalized;
  }

  private validatePricing(retailPrice: number, labCost: number, salePrice?: number | null) {
    if (retailPrice < labCost) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Retail price must be greater than or equal to lab cost',
      );
    }

    if (salePrice === undefined || salePrice === null) {
      return;
    }

    if (salePrice > retailPrice) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Sale price must be less than or equal to retail price',
      );
    }

    if (salePrice < labCost) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Sale price must be greater than or equal to lab cost',
      );
    }
  }

  private async ensureTestExists(testId: string) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { id: true },
    });

    if (!test) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Test not found');
    }
  }

  private async ensureLaboratoryExists(laboratoryId: string) {
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: laboratoryId },
      select: { id: true },
    });

    if (!laboratory) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Laboratory not found');
    }
  }

  private async ensureUniqueConstraints(
    testId: string,
    laboratoryId: string,
    labTestCode: string,
    excludeId?: string,
  ) {
    const [existingPair, existingCode] = await Promise.all([
      prisma.labTest.findFirst({
        where: {
          testId,
          laboratoryId,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      }),
      prisma.labTest.findFirst({
        where: {
          laboratoryId,
          labTestCode,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      }),
    ]);

    if (existingPair) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This test is already mapped to the selected laboratory',
      );
    }

    if (existingCode) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'This laboratory already uses the provided lab test code',
      );
    }
  }

  async getLabTests(query: GetLabTestsQuery) {
    const page = this.parsePositiveInt(query.page, 1);
    const rawLimit = this.parsePositiveInt(query.limit, 10);
    const limit = Math.min(rawLimit, 100);
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const isAvailable = this.parseBoolean(query.isAvailable);
    const isVisible = this.parseBoolean(query.isVisible);
    const sortBy = query.sortBy || 'sortOrder';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    const where: Prisma.LabTestWhereInput = {
      ...(query.testId ? { testId: query.testId } : {}),
      ...(query.laboratoryId ? { laboratoryId: query.laboratoryId } : {}),
      ...(isAvailable !== undefined ? { isAvailable } : {}),
      ...(isVisible !== undefined ? { isVisible } : {}),
      ...(search
        ? {
            OR: [
              {
                labTestCode: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                externalTestId: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                test: {
                  is: {
                    name: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                laboratory: {
                  is: {
                    name: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [labTests, total] = await prisma.$transaction([
      prisma.labTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder } as Prisma.LabTestOrderByWithRelationInput,
        include: {
          test: true,
          laboratory: true,
        },
      }),
      prisma.labTest.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: labTests,
    };
  }

  async getLabTestById(labTestId: string) {
    return prisma.labTest.findUnique({
      where: { id: labTestId },
      include: {
        test: true,
        laboratory: true,
      },
    });
  }

  async createLabTest(payload: LabTestPayload) {
    const testId = this.normalizeRequiredString(payload.testId, 'Test ID');
    const laboratoryId = this.normalizeRequiredString(payload.laboratoryId, 'Laboratory ID');
    const labTestCode = this.normalizeRequiredString(payload.labTestCode, 'Lab test code');
    const labCost = payload.labCost !== undefined ? this.parseNumber(payload.labCost, 'Lab cost') : 0;
    const retailPrice = this.parseNumber(payload.retailPrice, 'Retail price');
    const salePrice = this.parseNullableNumber(payload.salePrice, 'Sale price');
    const currency = this.normalizeCurrency(payload.currency) ?? 'USD';

    this.validatePricing(retailPrice, labCost, salePrice);

    await Promise.all([this.ensureTestExists(testId), this.ensureLaboratoryExists(laboratoryId)]);
    await this.ensureUniqueConstraints(testId, laboratoryId, labTestCode);

    const createdLabTest = await prisma.labTest.create({
      data: {
        testId,
        laboratoryId,
        labTestCode,
        externalTestId: this.normalizeOptionalString(payload.externalTestId),
        labCost,
        retailPrice,
        salePrice,
        currency,
        isAvailable: this.parseBoolean(payload.isAvailable) ?? true,
        isVisible: this.parseBoolean(payload.isVisible) ?? true,
        turnaroundDaysOverride: this.parseNullableInteger(
          payload.turnaroundDaysOverride,
          'Turnaround days override',
        ),
        specimenTypeOverride: this.normalizeOptionalString(payload.specimenTypeOverride),
        patientInstructionsOverride: this.normalizeOptionalString(
          payload.patientInstructionsOverride,
        ),
        sortOrder:
          payload.sortOrder !== undefined
            ? this.parseNonNegativeInt(payload.sortOrder, 'Sort order')
            : 0,
      },
      include: {
        test: true,
        laboratory: true,
      },
    });

    return createdLabTest;
  }

  async updateLabTest(labTestId: string, payload: LabTestPayload) {
    const existingLabTest = await prisma.labTest.findUnique({
      where: { id: labTestId },
      include: {
        test: {
          select: { id: true },
        },
        laboratory: {
          select: { id: true },
        },
      },
    });

    if (!existingLabTest) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Lab test not found');
    }

    const nextTestId = payload.testId ?? existingLabTest.testId;
    const nextLaboratoryId = payload.laboratoryId ?? existingLabTest.laboratoryId;
    const nextLabTestCode =
      payload.labTestCode !== undefined
        ? this.normalizeRequiredString(payload.labTestCode, 'Lab test code')
        : existingLabTest.labTestCode;
    const nextLabCost =
      payload.labCost !== undefined
        ? this.parseNumber(payload.labCost, 'Lab cost')
        : Number(existingLabTest.labCost);
    const nextRetailPrice =
      payload.retailPrice !== undefined
        ? this.parseNumber(payload.retailPrice, 'Retail price')
        : Number(existingLabTest.retailPrice);
    const nextSalePrice =
      payload.salePrice !== undefined
        ? this.parseNullableNumber(payload.salePrice, 'Sale price')
        : existingLabTest.salePrice === null
          ? null
          : Number(existingLabTest.salePrice);

    this.validatePricing(nextRetailPrice, nextLabCost, nextSalePrice);

    if (payload.testId !== undefined) {
      await this.ensureTestExists(nextTestId);
    }

    if (payload.laboratoryId !== undefined) {
      await this.ensureLaboratoryExists(nextLaboratoryId);
    }

    if (
      nextTestId !== existingLabTest.testId ||
      nextLaboratoryId !== existingLabTest.laboratoryId ||
      nextLabTestCode !== existingLabTest.labTestCode
    ) {
      await this.ensureUniqueConstraints(nextTestId, nextLaboratoryId, nextLabTestCode, labTestId);
    }

    return prisma.labTest.update({
      where: { id: labTestId },
      data: {
        ...(payload.testId !== undefined && { testId: nextTestId }),
        ...(payload.laboratoryId !== undefined && { laboratoryId: nextLaboratoryId }),
        ...(payload.labTestCode !== undefined && { labTestCode: nextLabTestCode }),
        ...(payload.externalTestId !== undefined && {
          externalTestId: this.normalizeOptionalString(payload.externalTestId),
        }),
        ...(payload.labCost !== undefined && {
          labCost: nextLabCost,
        }),
        ...(payload.retailPrice !== undefined && {
          retailPrice: nextRetailPrice,
        }),
        ...(payload.salePrice !== undefined && {
          salePrice: nextSalePrice,
        }),
        ...(payload.currency !== undefined && { currency: this.normalizeCurrency(payload.currency) }),
        ...(payload.isAvailable !== undefined && {
          isAvailable: this.parseBoolean(payload.isAvailable) ?? false,
        }),
        ...(payload.isVisible !== undefined && {
          isVisible: this.parseBoolean(payload.isVisible) ?? false,
        }),
        ...(payload.turnaroundDaysOverride !== undefined && {
          turnaroundDaysOverride: this.parseNullableInteger(
            payload.turnaroundDaysOverride,
            'Turnaround days override',
          ),
        }),
        ...(payload.specimenTypeOverride !== undefined && {
          specimenTypeOverride: this.normalizeOptionalString(payload.specimenTypeOverride),
        }),
        ...(payload.patientInstructionsOverride !== undefined && {
          patientInstructionsOverride: this.normalizeOptionalString(
            payload.patientInstructionsOverride,
          ),
        }),
        ...(payload.sortOrder !== undefined && {
          sortOrder: this.parseNonNegativeInt(payload.sortOrder, 'Sort order'),
        }),
      },
      include: {
        test: true,
        laboratory: true,
      },
    });
  }
}

export default new LabTestService();
