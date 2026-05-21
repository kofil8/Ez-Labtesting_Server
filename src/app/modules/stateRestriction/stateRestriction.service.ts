import { Laboratory, Prisma, RestrictionType } from '@prisma/client';
import axios from 'axios';
import { Request } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import { env } from '../../../config/env';
import redisClient from '../../../config/redis';
import ApiError from '../../errors/ApiErrors';
import logger from '../../utils/logger';

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

type LocationStatusSource =
  | 'geo_header'
  | 'ip_lookup'
  | 'checkout_state'
  | 'zip_lookup'
  | 'test_override'
  | 'unknown';

type EvaluateRestrictionParams = {
  stateCode?: string | null;
  testId?: string | null;
  laboratoryId?: string | null;
  laboratoryRoute?: string | null;
};

type GetLocationStatusParams = {
  req: Request;
  checkoutState?: string | null;
  zipCode?: string | null;
  testId?: string | null;
  laboratoryId?: string | null;
  publicIp?: string | null;
  laboratoryCode?: string | null;
};

type AssertOrderingAllowedParams = {
  req: Request;
  checkoutState?: string | null;
  labTestId?: string | null;
  testId?: string | null;
  laboratoryId?: string | null;
  laboratoryCode?: string | null;
};

type ResolvedLaboratoryRoute = {
  laboratoryId: string | null;
  laboratoryRoute: string | null;
};

type LocationStatus = {
  ip: string | null;
  maskedIp: string | null;
  countryCode: string | null;
  regionCode: string | null;
  regionName: string | null;
  city: string | null;
  detectedStateCode: string | null;
  effectiveStateCode: string | null;
  laboratoryRoute: string | null;
  restrictionType: RestrictionType | null;
  canOrder: boolean;
  reason: string | null;
  source: LocationStatusSource;
};

type GeoLookupSource = 'ipinfo' | 'ipwhois' | 'ipapi';

type GeoLookupResult = {
  ip: string;
  countryCode: string | null;
  regionCode: string | null;
  regionName: string | null;
  city: string | null;
  source: GeoLookupSource;
};

type ZipLookupResult = {
  zipCode: string;
  stateCode: string;
  stateName: string | null;
  city: string | null;
};

type ZippopotamResponse = {
  country?: string;
  'country abbreviation'?: string;
  places?: Array<{
    'place name'?: string;
    state?: string;
    'state abbreviation'?: string;
  }>;
};

export type RestrictionDecision = {
  restricted: boolean;
  reason?: string;
  stateCode?: string;
  stateName?: string;
  message: string;
};

const DEFAULT_LABORATORY_ROUTE = 'ACCESS';

const BLOCKED_REASON = 'Ordering is unavailable in your region.';
const REQUIRES_PHYSICIAN_REASON =
  'Orders from your region require physician review and are not available online.';
const RESTRICTED_STATE_MESSAGE =
  'We are coming soon to your area. Ordering is currently unavailable in your state.';
const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

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

  private normalizeIp(ip: string | null | undefined) {
    const trimmed = ip?.trim();
    if (!trimmed) {
      return null;
    }

    const withoutPort = trimmed.match(/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/)
      ? trimmed.replace(/:\d+$/, '')
      : trimmed;

    return withoutPort.toLowerCase().startsWith('::ffff:')
      ? withoutPort.slice('::ffff:'.length)
      : withoutPort;
  }

  private isPrivateOrLocalIp(ip: string) {
    const normalized = this.normalizeIp(ip)?.toLowerCase() || '';

    if (
      !normalized ||
      normalized === '::1' ||
      normalized === 'localhost' ||
      normalized.startsWith('127.') ||
      normalized.startsWith('10.') ||
      normalized.startsWith('192.168.') ||
      normalized.startsWith('169.254.') ||
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
    const trustedProxyIp = this.normalizeIp(req.ip);
    if (trustedProxyIp && !this.isPrivateOrLocalIp(trustedProxyIp)) {
      return trustedProxyIp;
    }

    const remoteAddress = this.normalizeIp(req.socket?.remoteAddress);
    const canUseProxyFallback = Boolean(
      trustedProxyIp ||
        (remoteAddress && this.isPrivateOrLocalIp(remoteAddress)) ||
        process.env.NODE_ENV === 'test',
    );

    if (!canUseProxyFallback) {
      return trustedProxyIp;
    }

    const headerCandidates = [req.headers['x-forwarded-for'], req.headers['x-real-ip']];
    for (const candidate of headerCandidates) {
      const rawValue = Array.isArray(candidate) ? candidate[0] : candidate;
      const ip = this.normalizeIp(rawValue?.split(',')[0]);

      if (ip) {
        return ip;
      }
    }

    return trustedProxyIp;
  }

  async resolvePublicIp(req: Request, explicitPublicIp?: string | null) {
    const overrideIp = this.getRestrictionTestIp();
    if (overrideIp) {
      return overrideIp;
    }

    const normalizedExplicitIp = this.normalizeIp(explicitPublicIp);
    if (normalizedExplicitIp && !this.isPrivateOrLocalIp(normalizedExplicitIp)) {
      return normalizedExplicitIp;
    }

    const requestIp = this.normalizeIp(this.resolveClientIp(req));
    if (requestIp && !this.isPrivateOrLocalIp(requestIp)) {
      return requestIp;
    }

    return null;
  }

  private getRestrictionTestState() {
    const stateCode = this.sanitizeStateCode(env.RESTRICTION_TEST_STATE);
    if (!stateCode) {
      return null;
    }

    if (env.NODE_ENV === 'production' && !env.ALLOW_PRODUCTION_RESTRICTION_TEST_OVERRIDE) {
      return null;
    }

    return stateCode;
  }

  private getRestrictionTestIp() {
    const ip = this.normalizeIp(env.RESTRICTION_TEST_IP);
    if (!ip) {
      return null;
    }

    if (env.NODE_ENV === 'production' && !env.ALLOW_PRODUCTION_RESTRICTION_TEST_OVERRIDE) {
      return null;
    }

    return ip;
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

  private getGeoCacheKey(ip: string) {
    return `geoip:${ip}`;
  }

  private getZipCacheKey(zipCode: string) {
    return `zip:${zipCode}`;
  }

  private normalizeZipCode(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized && /^\d{5}$/.test(normalized) ? normalized : null;
  }

  private async readZipCache(zipCode: string): Promise<ZipLookupResult | null> {
    try {
      const cached = await redisClient.get(this.getZipCacheKey(zipCode));
      return cached ? (JSON.parse(cached) as ZipLookupResult) : null;
    } catch (error) {
      logger.warn(
        JSON.stringify({
          event: 'zip_cache_read_failed',
          zipCode,
          error: error instanceof Error ? error.message : 'unknown',
        }),
      );
      return null;
    }
  }

  private async writeZipCache(result: ZipLookupResult) {
    try {
      await redisClient.set(this.getZipCacheKey(result.zipCode), JSON.stringify(result), 'EX', 86400);
    } catch (error) {
      logger.warn(
        JSON.stringify({
          event: 'zip_cache_write_failed',
          zipCode: result.zipCode,
          error: error instanceof Error ? error.message : 'unknown',
        }),
      );
    }
  }

  private async lookupStateFromZip(zipCode: string): Promise<ZipLookupResult> {
    const cached = await this.readZipCache(zipCode);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get<ZippopotamResponse>(
        `https://api.zippopotam.us/us/${encodeURIComponent(zipCode)}`,
        { timeout: 5000 },
      );
      const place = response.data.places?.[0];
      const stateCode = this.sanitizeStateCode(place?.['state abbreviation']);

      if (!stateCode) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'ZIP code must be a valid U.S. ZIP code');
      }

      const result: ZipLookupResult = {
        zipCode,
        stateCode,
        stateName: place?.state || US_STATE_NAMES[stateCode] || null,
        city: place?.['place name'] || null,
      };

      await this.writeZipCache(result);
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'ZIP code must be a valid U.S. ZIP code');
      }

      throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Unable to verify ZIP code right now');
    }
  }

  private async readGeoCache(ip: string): Promise<GeoLookupResult | null> {
    try {
      const cached = await redisClient.get(this.getGeoCacheKey(ip));
      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as GeoLookupResult;
    } catch (error) {
      logger.warn(
        JSON.stringify({
          event: 'geoip_cache_read_failed',
          ip: this.maskIp(ip),
          error: error instanceof Error ? error.message : 'unknown',
        }),
      );
      return null;
    }
  }

  private async writeGeoCache(result: GeoLookupResult) {
    try {
      await redisClient.set(
        this.getGeoCacheKey(result.ip),
        JSON.stringify(result),
        'EX',
        env.IP_GEO_CACHE_TTL_SECONDS,
      );
    } catch (error) {
      logger.warn(
        JSON.stringify({
          event: 'geoip_cache_write_failed',
          ip: this.maskIp(result.ip),
          error: error instanceof Error ? error.message : 'unknown',
        }),
      );
    }
  }

  private buildIpinfoUrl(ip: string) {
    const targetUrl = new URL(`https://api.ipinfo.io/lookup/${encodeURIComponent(ip)}`);
    if (env.IPINFO_TOKEN) {
      targetUrl.searchParams.set('token', env.IPINFO_TOKEN);
    }
    return targetUrl.toString();
  }

  private async requestIpinfoLookup(ip: string): Promise<GeoLookupResult | null> {
    if (!env.IPINFO_TOKEN) {
      return null;
    }

    const response = await axios.get(this.buildIpinfoUrl(ip), {
      timeout: env.IP_GEOLOOKUP_TIMEOUT_MS,
    });
    const data = response.data as {
      ip?: string;
      country_code?: string;
      country?: string;
      region_code?: string;
      region?: string;
      city?: string;
    };

    return {
      ip: this.normalizeIp(data.ip) || ip,
      countryCode: (data.country_code || data.country)?.trim().toUpperCase() || null,
      regionCode: this.sanitizeStateCode(data.region_code),
      regionName: data.region?.trim() || null,
      city: data.city?.trim() || null,
      source: 'ipinfo',
    };
  }

  private async requestIpwhoisLookup(ip: string): Promise<GeoLookupResult | null> {
    const targetUrl = env.IP_GEOLOOKUP_URL_TEMPLATE.replace('{ip}', encodeURIComponent(ip));
    const response = await axios.get(targetUrl, {
      timeout: env.IP_GEOLOOKUP_TIMEOUT_MS,
    });
    const data = response.data as {
      success?: boolean;
      country_code?: string;
      region_code?: string;
      region?: string;
      city?: string;
    };

    if (data?.success === false) {
      return null;
    }

    return {
      ip,
      countryCode: data.country_code?.trim().toUpperCase() || null,
      regionCode: this.sanitizeStateCode(data.region_code),
      regionName: data.region?.trim() || null,
      city: data.city?.trim() || null,
      source: 'ipwhois',
    };
  }

  private async requestIpApiLookup(ip: string): Promise<GeoLookupResult | null> {
    const targetUrl = `http://ip-api.com/json/${encodeURIComponent(
      ip,
    )}?fields=status,countryCode,region,regionName,city,query`;
    const response = await axios.get(targetUrl, {
      timeout: env.IP_GEOLOOKUP_TIMEOUT_MS,
    });
    const data = response.data as {
      status?: string;
      countryCode?: string;
      region?: string;
      regionName?: string;
      city?: string;
      query?: string;
    };

    if (data?.status && data.status !== 'success') {
      return null;
    }

    return {
      ip: this.normalizeIp(data.query) || ip,
      countryCode: data.countryCode?.trim().toUpperCase() || null,
      regionCode: this.sanitizeStateCode(data.region),
      regionName: data.regionName?.trim() || null,
      city: data.city?.trim() || null,
      source: 'ipapi',
    };
  }

  private isUsStateLookupResult(result: GeoLookupResult | null) {
    return Boolean(result?.countryCode === 'US' && this.sanitizeStateCode(result.regionCode));
  }

  private async requestGeoLookup(ip: string): Promise<GeoLookupResult | null> {
    const lookupOrder: GeoLookupSource[] =
      env.IP_GEO_PROVIDER === 'ipwhois'
        ? ['ipwhois', 'ipinfo', 'ipapi']
        : ['ipinfo', 'ipwhois', 'ipapi'];

    const attempted = new Set<GeoLookupSource>();

    for (const provider of lookupOrder) {
      if (attempted.has(provider)) {
        continue;
      }
      attempted.add(provider);

      try {
        const result =
          provider === 'ipinfo'
            ? await this.requestIpinfoLookup(ip)
            : provider === 'ipwhois'
              ? await this.requestIpwhoisLookup(ip)
              : await this.requestIpApiLookup(ip);

        if (!result) {
          continue;
        }

        if (this.isUsStateLookupResult(result)) {
          return {
            ...result,
            regionCode: this.sanitizeStateCode(result.regionCode),
          };
        }

        if (result.countryCode && result.countryCode !== 'US') {
          return result;
        }
      } catch (error) {
        logger.warn(
          JSON.stringify({
            event: 'geoip_provider_failed',
            provider,
            ip: this.maskIp(ip),
            error: error instanceof Error ? error.message : 'unknown',
          }),
        );
      }
    }

    return null;
  }

  async lookupGeoFromIp(ip: string | null): Promise<GeoLookupResult | null> {
    if (!ip || this.isPrivateOrLocalIp(ip)) {
      return null;
    }

    const cached = await this.readGeoCache(ip);
    if (cached) {
      return cached;
    }

    const result = await this.requestGeoLookup(ip);
    if (result) {
      await this.writeGeoCache(result);
    }

    return result;
  }

  async lookupStateFromIp(ip: string | null) {
    const geo = await this.lookupGeoFromIp(ip);
    if (geo?.countryCode !== 'US') {
      return null;
    }

    return this.sanitizeStateCode(geo.regionCode);
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

  buildRestrictionDecision(status: LocationStatus): RestrictionDecision {
    const stateCode = status.effectiveStateCode || status.detectedStateCode || undefined;

    if (!status.canOrder) {
      return {
        restricted: true,
        reason: status.reason || undefined,
        stateCode,
        stateName: stateCode ? US_STATE_NAMES[stateCode] || stateCode : undefined,
        message: RESTRICTED_STATE_MESSAGE,
      };
    }

    return {
      restricted: false,
      stateCode,
      stateName: stateCode ? US_STATE_NAMES[stateCode] || stateCode : undefined,
      message: 'Available for online ordering.',
    };
  }

  async getLocationStatus(params: GetLocationStatusParams): Promise<LocationStatus> {
    const ip = await this.resolvePublicIp(params.req, params.publicIp);
    const maskedIp = this.maskIp(ip);
    const overrideState = this.getRestrictionTestState();
    const detectedFromHeaders = this.resolveStateFromGeoHeaders(params.req);
    const geo = overrideState || detectedFromHeaders ? null : await this.lookupGeoFromIp(ip);
    const detectedFromIp = geo?.countryCode === 'US' ? this.sanitizeStateCode(geo.regionCode) : null;
    const detectedStateCode = overrideState || detectedFromHeaders || detectedFromIp;
    const checkoutState = this.sanitizeStateCode(params.checkoutState);
    const zipCode = this.normalizeZipCode(params.zipCode);
    const zipLookup = zipCode ? await this.lookupStateFromZip(zipCode) : null;
    const effectiveStateCode = checkoutState || zipLookup?.stateCode || detectedStateCode || null;
    const source: LocationStatusSource = checkoutState
      ? 'checkout_state'
      : zipLookup
        ? 'zip_lookup'
      : overrideState
        ? 'test_override'
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
      countryCode: zipLookup || overrideState || detectedFromHeaders ? 'US' : geo?.countryCode || null,
      regionCode: zipLookup?.stateCode || detectedStateCode || geo?.regionCode || null,
      regionName: zipLookup?.stateName
        ? zipLookup.stateName
        : detectedStateCode
        ? US_STATE_NAMES[detectedStateCode] || geo?.regionName || null
        : geo?.regionName || null,
      city: zipLookup?.city || geo?.city || null,
      detectedStateCode: detectedStateCode || null,
      effectiveStateCode,
      laboratoryRoute: effectiveLaboratory.laboratoryRoute,
      restrictionType: evaluation.restrictionType,
      canOrder: evaluation.canOrder,
      reason: evaluation.reason,
      source,
    };
  }

  private async resolveLabTestContext(params: {
    labTestId?: string | null;
    testId?: string | null;
    laboratoryId?: string | null;
    laboratoryCode?: string | null;
  }) {
    if (!params.labTestId) {
      return {
        testId: params.testId ?? null,
        laboratoryId: params.laboratoryId ?? null,
        laboratoryCode: params.laboratoryCode ?? null,
      };
    }

    const labTest = await prisma.labTest.findFirst({
      where: {
        OR: [{ id: params.labTestId }, { testId: params.labTestId }],
        ...(params.laboratoryId ? { laboratoryId: params.laboratoryId } : {}),
        ...(params.laboratoryCode ? { laboratory: { code: params.laboratoryCode } } : {}),
      },
      select: {
        testId: true,
        laboratoryId: true,
        laboratory: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!labTest) {
      return {
        testId: params.testId ?? null,
        laboratoryId: params.laboratoryId ?? null,
        laboratoryCode: params.laboratoryCode ?? null,
      };
    }

    return {
      testId: params.testId ?? labTest.testId,
      laboratoryId: params.laboratoryId ?? labTest.laboratoryId,
      laboratoryCode: params.laboratoryCode ?? labTest.laboratory.code,
    };
  }

  async assertOrderingAllowed(params: AssertOrderingAllowedParams) {
    const context = await this.resolveLabTestContext(params);
    const status = await this.getLocationStatus({
      req: params.req,
      checkoutState: params.checkoutState,
      testId: context.testId,
      laboratoryId: context.laboratoryId,
      laboratoryCode: context.laboratoryCode,
    });

    if (status.canOrder) {
      return status;
    }

    const decision = this.buildRestrictionDecision(status);

    throw new ApiError(
      httpStatus.FORBIDDEN,
      decision.message,
      {
        stateCode: decision.stateCode,
        stateName: decision.stateName,
        restrictionType: status.restrictionType,
        reason: decision.reason || status.reason || null,
        source: status.source,
        ip: status.ip,
        maskedIp: status.maskedIp,
        laboratoryRoute: status.laboratoryRoute,
      },
      'RESTRICTED_STATE',
    );
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
