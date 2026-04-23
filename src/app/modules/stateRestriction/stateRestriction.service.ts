import { Laboratory, Prisma, RestrictionType } from '@prisma/client';
import axios from 'axios';
import { Request } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import { env } from '../../../config/env';
import ApiError from '../../errors/ApiErrors';

type StateRestrictionPayload = {
  stateCode?: string;
  testId?: string | null;
  laboratoryId?: string | null;
  restrictionType?: RestrictionType;
  notes?: string | null;
  isActive?: boolean | string;
};

type GetRestrictionsQuery = {
  page?: number | string;
  limit?: number | string;
  stateCode?: string;
  testId?: string;
  laboratoryId?: string;
  restrictionType?: RestrictionType;
  isActive?: boolean | string;
  sortBy?: 'stateCode' | 'restrictionType' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

type LocationStatusSource = 'geo_header' | 'ip_lookup' | 'checkout_state' | 'unknown';

type EvaluateRestrictionParams = {
  stateCode?: string | null;
  testId?: string | null;
  laboratoryId?: string | null;
  laboratoryRoute?: string | null;
};

type GetLocationStatusParams = {
  req: Request;
  checkoutState?: string | null;
  testId?: string | null;
  laboratoryId?: string | null;
  publicIp?: string | null;
  laboratoryCode?: string | null;
};

type ResolvedLaboratoryRoute = {
  laboratoryId: string | null;
  laboratoryRoute: string | null;
};

type LocationStatus = {
  ip: string | null;
  maskedIp: string | null;
  detectedStateCode: string | null;
  effectiveStateCode: string | null;
  laboratoryRoute: string | null;
  restrictionType: RestrictionType | null;
  canOrder: boolean;
  reason: string | null;
  source: LocationStatusSource;
};

const DEFAULT_LABORATORY_ROUTE = 'ACCESS';

const BLOCKED_REASON = 'Ordering is unavailable in your region.';
const REQUIRES_PHYSICIAN_REASON =
  'Orders from your region require physician review and are not available online.';

class StateRestrictionService {
  private parsePositiveInt(value: number | string | undefined, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }

    return Math.trunc(parsed);
  }

  private parseBoolean(value: boolean | string | undefined) {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  }

  private normalizeStateCode(value: string | undefined) {
    const normalized = value?.trim().toUpperCase();

    if (!normalized) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'State code is required');
    }

    return normalized;
  }

  private normalizeOptionalString(value: string | null | undefined) {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private sanitizeStateCode(value: string | null | undefined) {
    const normalized = value?.trim().toUpperCase();
    if (!normalized || !/^[A-Z]{2}$/.test(normalized)) {
      return null;
    }

    return normalized;
  }

  private getRestrictionReason(restrictionType: RestrictionType | null) {
    if (restrictionType === 'BLOCKED') {
      return BLOCKED_REASON;
    }

    if (restrictionType === 'REQUIRES_PHYSICIAN') {
      return REQUIRES_PHYSICIAN_REASON;
    }

    return 'Available for online ordering.';
  }

  private isPrivateOrLocalIp(ip: string) {
    const normalized = ip.trim().toLowerCase();

    if (
      !normalized ||
      normalized === '::1' ||
      normalized === 'localhost' ||
      normalized.startsWith('127.') ||
      normalized.startsWith('10.') ||
      normalized.startsWith('192.168.') ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd')
    ) {
      return true;
    }

    const ipv4Match = normalized.match(/^172\.(\d{1,3})\./);
    if (ipv4Match) {
      const secondOctet = Number.parseInt(ipv4Match[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return true;
      }
    }

    return false;
  }

  private maskIp(ip: string | null) {
    if (!ip) {
      return null;
    }

    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.xxx.xxx.${parts[3]}`;
      }
    }

    if (ip.includes(':')) {
      const parts = ip.split(':').filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}:xxxx:${parts[parts.length - 1]}`;
      }
    }

    return 'masked';
  }

  private async findLaboratoryByCode(code: string): Promise<Pick<Laboratory, 'id' | 'code'> | null> {
    return prisma.laboratory.findUnique({
      where: { code },
      select: { id: true, code: true },
    });
  }

  resolveClientIp(req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const firstForwarded = forwarded
        .split(',')
        .map((part) => part.trim())
        .find(Boolean);
      if (firstForwarded) {
        return firstForwarded;
      }
    }

    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim()) {
      return realIp.trim();
    }

    return req.ip || null;
  }

  private normalizeIp(ip: string | null | undefined) {
    const normalized = ip?.trim();
    return normalized ? normalized : null;
  }

  async resolvePublicIp(req: Request, explicitPublicIp?: string | null) {
    const normalizedExplicitIp = this.normalizeIp(explicitPublicIp);
    if (normalizedExplicitIp && !this.isPrivateOrLocalIp(normalizedExplicitIp)) {
      return normalizedExplicitIp;
    }

    const requestIp = this.normalizeIp(this.resolveClientIp(req));
    if (requestIp && !this.isPrivateOrLocalIp(requestIp)) {
      return requestIp;
    }

    try {
      const response = await axios.get(env.PUBLIC_IP_LOOKUP_URL_TEMPLATE, {
        timeout: env.PUBLIC_IP_LOOKUP_TIMEOUT_MS,
      });
      const data = response.data as { ip?: string };
      const fallbackIp = this.normalizeIp(data?.ip);

      if (fallbackIp && !this.isPrivateOrLocalIp(fallbackIp)) {
        return fallbackIp;
      }
    } catch {
      return null;
    }

    return requestIp;
  }

  resolveStateFromGeoHeaders(req: Request) {
    const rawRegionHeaders = [
      req.headers['x-vercel-ip-country-region'],
      req.headers['cloudfront-viewer-country-region'],
      req.headers['x-geo-region'],
    ];
    const rawCountryHeaders = [
      req.headers['x-vercel-ip-country'],
      req.headers['cloudfront-viewer-country'],
      req.headers['x-geo-country'],
    ];

    const region = rawRegionHeaders
      .map((value) => (Array.isArray(value) ? value[0] : value))
      .find((value): value is string => Boolean(value?.trim()));
    const country = rawCountryHeaders
      .map((value) => (Array.isArray(value) ? value[0] : value))
      .find((value): value is string => Boolean(value?.trim()));

    const normalizedRegion = this.sanitizeStateCode(region);
    const normalizedCountry = country?.trim().toUpperCase();

    if (!normalizedRegion) {
      return null;
    }

    if (normalizedCountry === 'US' || /^[A-Z]{2}$/.test(normalizedRegion)) {
      return normalizedRegion;
    }

    return null;
  }

  async lookupStateFromIp(ip: string | null) {
    if (!ip || this.isPrivateOrLocalIp(ip)) {
      return null;
    }

    try {
      const targetUrl = env.IP_GEOLOOKUP_URL_TEMPLATE.replace('{ip}', encodeURIComponent(ip));
      const response = await axios.get(targetUrl, {
        timeout: env.IP_GEOLOOKUP_TIMEOUT_MS,
      });
      const data = response.data as {
        success?: boolean;
        country_code?: string;
        region_code?: string;
      };

      if (data?.success === false) {
        return null;
      }

      if (data?.country_code?.toUpperCase() !== 'US') {
        return null;
      }

      return this.sanitizeStateCode(data.region_code);
    } catch {
      return null;
    }
  }

  async resolveEffectiveLaboratoryRoute(params: {
    laboratoryId?: string | null;
    laboratoryCode?: string | null;
  }): Promise<ResolvedLaboratoryRoute> {
    if (params.laboratoryId) {
      const laboratory = await prisma.laboratory.findUnique({
        where: { id: params.laboratoryId },
        select: { id: true, code: true },
      });

      if (!laboratory) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Laboratory not found');
      }

      return {
        laboratoryId: laboratory.id,
        laboratoryRoute: laboratory.code,
      };
    }

    if (params.laboratoryCode) {
      const normalizedCode = params.laboratoryCode.trim().toUpperCase();
      const laboratory = await this.findLaboratoryByCode(normalizedCode);

      if (!laboratory) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Laboratory route is invalid',
          { laboratoryRoute: normalizedCode },
          'INVALID_LABORATORY_ROUTE',
        );
      }

      return {
        laboratoryId: laboratory.id,
        laboratoryRoute: laboratory.code,
      };
    }

    const defaultLaboratory = await this.findLaboratoryByCode(DEFAULT_LABORATORY_ROUTE);

    return {
      laboratoryId: defaultLaboratory?.id ?? null,
      laboratoryRoute: defaultLaboratory?.code ?? DEFAULT_LABORATORY_ROUTE,
    };
  }

  async evaluateRestriction(params: EvaluateRestrictionParams) {
    const stateCode = this.sanitizeStateCode(params.stateCode);
    const laboratoryId = params.laboratoryId ?? null;
    const testId = params.testId ?? null;

    if (!stateCode) {
      return {
        restrictionType: null,
        canOrder: true,
        reason: null,
        matchedRestriction: null,
      };
    }

    const orderBy = { createdAt: 'asc' as const };

    const candidates: Prisma.StateRestrictionWhereInput[] = [];

    if (laboratoryId && testId) {
      candidates.push({
        stateCode,
        laboratoryId,
        testId,
        isActive: true,
      });
    }

    if (laboratoryId) {
      candidates.push({
        stateCode,
        laboratoryId,
        testId: null,
        isActive: true,
      });
    }

    if (testId) {
      candidates.push({
        stateCode,
        laboratoryId: null,
        testId,
        isActive: true,
      });
    }

    candidates.push({
      stateCode,
      laboratoryId: null,
      testId: null,
      isActive: true,
    });

    const seen = new Set<string>();

    for (const where of candidates) {
      const key = JSON.stringify(where);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      const matchedRestriction = await prisma.stateRestriction.findFirst({
        where,
        include: {
          laboratory: { select: { id: true, code: true } },
        },
        orderBy,
      });

      if (matchedRestriction) {
        return {
          restrictionType: matchedRestriction.restrictionType,
          canOrder: false,
          reason: this.getRestrictionReason(matchedRestriction.restrictionType),
          matchedRestriction,
        };
      }
    }

    return {
      restrictionType: null,
      canOrder: true,
      reason: null,
      matchedRestriction: null,
    };
  }

  async getLocationStatus(params: GetLocationStatusParams): Promise<LocationStatus> {
    const ip = await this.resolvePublicIp(params.req, params.publicIp);
    const maskedIp = this.maskIp(ip);
    const detectedFromHeaders = this.resolveStateFromGeoHeaders(params.req);
    const detectedFromIp = detectedFromHeaders ? null : await this.lookupStateFromIp(ip);
    const detectedStateCode = detectedFromHeaders || detectedFromIp;
    const checkoutState = this.sanitizeStateCode(params.checkoutState);
    const effectiveStateCode = checkoutState || detectedStateCode || null;
    const source: LocationStatusSource = checkoutState
      ? 'checkout_state'
      : detectedFromHeaders
        ? 'geo_header'
        : detectedFromIp
          ? 'ip_lookup'
          : 'unknown';
    const effectiveLaboratory = await this.resolveEffectiveLaboratoryRoute({
      laboratoryId: params.laboratoryId,
      laboratoryCode: params.laboratoryCode,
    });
    const evaluation = await this.evaluateRestriction({
      stateCode: effectiveStateCode,
      testId: params.testId ?? null,
      laboratoryId: effectiveLaboratory.laboratoryId,
      laboratoryRoute: effectiveLaboratory.laboratoryRoute,
    });

    return {
      ip,
      maskedIp,
      detectedStateCode: detectedStateCode || null,
      effectiveStateCode,
      laboratoryRoute: effectiveLaboratory.laboratoryRoute,
      restrictionType: evaluation.restrictionType,
      canOrder: evaluation.canOrder,
      reason: evaluation.reason,
      source,
    };
  }

  private async ensureNoDuplicateRestriction(
    stateCode: string,
    testId: string | null,
    laboratoryId: string | null,
    restrictionType: RestrictionType,
    excludeId?: string,
  ) {
    const existingRestriction = await prisma.stateRestriction.findFirst({
      where: {
        stateCode,
        testId,
        laboratoryId,
        restrictionType,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existingRestriction) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'A matching state restriction already exists for this state, test, laboratory, and restriction type',
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

  async getRestrictions(query: GetRestrictionsQuery) {
    const page = this.parsePositiveInt(query.page, 1);
    const rawLimit = this.parsePositiveInt(query.limit, 10);
    const limit = Math.min(rawLimit, 100);
    const skip = (page - 1) * limit;
    const isActive = this.parseBoolean(query.isActive);
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    const where: Prisma.StateRestrictionWhereInput = {
      ...(query.stateCode ? { stateCode: query.stateCode.trim().toUpperCase() } : {}),
      ...(query.testId ? { testId: query.testId } : {}),
      ...(query.laboratoryId ? { laboratoryId: query.laboratoryId } : {}),
      ...(query.restrictionType ? { restrictionType: query.restrictionType } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };

    const [restrictions, total] = await prisma.$transaction([
      prisma.stateRestriction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder } as Prisma.StateRestrictionOrderByWithRelationInput,
        include: {
          test: true,
          laboratory: true,
        },
      }),
      prisma.stateRestriction.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: restrictions,
    };
  }

  async getRestrictionById(restrictionId: string) {
    return prisma.stateRestriction.findUnique({
      where: { id: restrictionId },
      include: {
        test: true,
        laboratory: true,
      },
    });
  }

  async createRestriction(payload: StateRestrictionPayload) {
    const stateCode = this.normalizeStateCode(payload.stateCode);
    const testId = payload.testId ?? null;
    const laboratoryId = payload.laboratoryId ?? null;

    if (!testId && !laboratoryId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'At least one of testId or laboratoryId is required',
      );
    }

    await Promise.all([
      testId ? this.ensureTestExists(testId) : Promise.resolve(),
      laboratoryId ? this.ensureLaboratoryExists(laboratoryId) : Promise.resolve(),
    ]);
    await this.ensureNoDuplicateRestriction(
      stateCode,
      testId,
      laboratoryId,
      payload.restrictionType!,
    );

    return prisma.stateRestriction.create({
      data: {
        stateCode,
        testId,
        laboratoryId,
        restrictionType: payload.restrictionType!,
        notes: this.normalizeOptionalString(payload.notes),
        isActive: this.parseBoolean(payload.isActive) ?? true,
      },
      include: {
        test: true,
        laboratory: true,
      },
    });
  }

  async updateRestriction(restrictionId: string, payload: StateRestrictionPayload) {
    const existingRestriction = await prisma.stateRestriction.findUnique({
      where: { id: restrictionId },
      select: {
        id: true,
        stateCode: true,
        testId: true,
        laboratoryId: true,
        restrictionType: true,
      },
    });

    if (!existingRestriction) {
      throw new ApiError(httpStatus.NOT_FOUND, 'State restriction not found');
    }

    const nextTestId =
      payload.testId !== undefined ? payload.testId : existingRestriction.testId ?? null;
    const nextLaboratoryId =
      payload.laboratoryId !== undefined
        ? payload.laboratoryId
        : existingRestriction.laboratoryId ?? null;
    const nextStateCode =
      payload.stateCode !== undefined
        ? this.normalizeStateCode(payload.stateCode)
        : existingRestriction.stateCode;
    const nextRestrictionType =
      payload.restrictionType !== undefined
        ? payload.restrictionType
        : existingRestriction.restrictionType;

    if (!nextTestId && !nextLaboratoryId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'At least one of testId or laboratoryId is required',
      );
    }

    await Promise.all([
      nextTestId ? this.ensureTestExists(nextTestId) : Promise.resolve(),
      nextLaboratoryId ? this.ensureLaboratoryExists(nextLaboratoryId) : Promise.resolve(),
    ]);
    await this.ensureNoDuplicateRestriction(
      nextStateCode,
      nextTestId,
      nextLaboratoryId,
      nextRestrictionType,
      restrictionId,
    );

    return prisma.stateRestriction.update({
      where: { id: restrictionId },
      data: {
        ...(payload.stateCode !== undefined && {
          stateCode: nextStateCode,
        }),
        ...(payload.testId !== undefined && { testId: nextTestId }),
        ...(payload.laboratoryId !== undefined && { laboratoryId: nextLaboratoryId }),
        ...(payload.restrictionType !== undefined && {
          restrictionType: nextRestrictionType,
        }),
        ...(payload.notes !== undefined && {
          notes: this.normalizeOptionalString(payload.notes),
        }),
        ...(payload.isActive !== undefined && {
          isActive: this.parseBoolean(payload.isActive) ?? false,
        }),
      },
      include: {
        test: true,
        laboratory: true,
      },
    });
  }
}

export default new StateRestrictionService();
