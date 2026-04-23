import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiErrors';
import {
  googlePlacesService,
  LabCenterFromGoogle,
  PlaceAutocompleteSuggestion,
  PlaceDetailsResult,
} from '../../services/google-places.service';
import {
  matchesProviderCode,
  normalizeProviderCode,
  PROVIDER_CODES,
  PROVIDER_LABELS,
  ProviderCode,
} from './providers';
import { US_STATE_CENTERS } from './us-states';

const DEFAULT_RADIUS_MILES = 25;
const FALLBACK_RADIUS_MILES = 100;
const PARTNER_RESULTS_TARGET = 8;
const MAX_RESULTS = 24;
const NATIONWIDE_CACHE_TTL_MS = 30 * 60 * 1000;
const NATIONWIDE_DEFAULT_PAGE = 1;
const NATIONWIDE_DEFAULT_PAGE_SIZE = 12;
const NATIONWIDE_MAX_PAGE_SIZE = 24;

type RawLabCenterQuery = {
  lat?: string | string[];
  lng?: string | string[];
  radius?: string | string[];
  search?: string | string[];
  type?: string | string[];
  providerCode?: string | string[];
  providerCodes?: string | string[];
  status?: string | string[];
  isActive?: string | string[];
};

type RawNationwideQuery = {
  country?: string | string[];
  providers?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
};

type LabCenterRecord = {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  type: string;
  hours: string | null;
  status: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  lastVerified: Date;
  createdAt: Date;
  updatedAt: Date;
  distance?: number;
  providerCode: ProviderCode | null;
  providerLabel: string | null;
  source: 'database' | 'places';
  matchType: 'partner' | 'reference';
  selectionAllowed: boolean;
};

type NormalizedQuery = {
  lat?: number;
  lng?: number;
  radius: number;
  search: string;
  type: string;
  providerCodes: ProviderCode[];
  status: string;
  isActive?: boolean;
};

type NationwideLabGroup = {
  stateCode: string;
  stateName: string;
  providerCode: ProviderCode;
  providerLabel: string;
  sampleLabs: ReturnType<typeof toClientPayload>[];
  source: 'places';
  matchType: 'reference';
};

type NationwideResult = {
  groups: NationwideLabGroup[];
  meta: {
    page: number;
    pageSize: number;
    totalGroups: number;
    excludedStates: string[];
  };
};

type NationwideCacheEntry = {
  expiresAt: number;
  value: LabCenterRecord[];
};

const nationwideResultsCache = new Map<string, NationwideCacheEntry>();

const asSingle = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parseNumber = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseBoolean = (value: string | undefined): boolean | undefined => {
  if (!value) {
    return undefined;
  }

  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  return undefined;
};

const parseProviderCodes = (
  primaryProviderCode: string | undefined,
  providerCodesValue: string | undefined,
): ProviderCode[] => {
  const providerCodes = (providerCodesValue || '')
    .split(',')
    .map((value) => normalizeProviderCode(value))
    .filter((value): value is ProviderCode => Boolean(value));
  const primary = normalizeProviderCode(primaryProviderCode);

  return [
    ...new Set(
      [primary, ...providerCodes].filter((value): value is ProviderCode => Boolean(value)),
    ),
  ];
};

const normalizeQuery = (query: RawLabCenterQuery): NormalizedQuery => {
  const radius = parseNumber(asSingle(query.radius)) ?? DEFAULT_RADIUS_MILES;

  return {
    lat: parseNumber(asSingle(query.lat)),
    lng: parseNumber(asSingle(query.lng)),
    radius: Math.min(Math.max(radius, 5), FALLBACK_RADIUS_MILES),
    search: (asSingle(query.search) || '').trim(),
    type: (asSingle(query.type) || 'all').trim(),
    providerCodes: parseProviderCodes(asSingle(query.providerCode), asSingle(query.providerCodes)),
    status: (asSingle(query.status) || 'all').trim(),
    isActive: parseBoolean(asSingle(query.isActive)),
  };
};

const normalizeNationwideQuery = (query: RawNationwideQuery) => {
  const country = (asSingle(query.country) || 'US').trim().toUpperCase();
  const requestedProviders = (asSingle(query.providers) || '')
    .split(',')
    .map((value) => normalizeProviderCode(value))
    .filter((value): value is ProviderCode => Boolean(value));

  return {
    country,
    providers: requestedProviders.length > 0 ? requestedProviders : PROVIDER_CODES,
    page: parsePositiveInt(asSingle(query.page), NATIONWIDE_DEFAULT_PAGE),
    pageSize: Math.min(
      parsePositiveInt(asSingle(query.pageSize), NATIONWIDE_DEFAULT_PAGE_SIZE),
      NATIONWIDE_MAX_PAGE_SIZE,
    ),
  };
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const earthRadiusMiles = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
};

const roundDistance = (distance?: number) =>
  distance === undefined ? undefined : Math.round(distance * 10) / 10;

const matchesSearch = (
  search: string,
  values: Array<string | null | undefined>,
): boolean => {
  if (!search) {
    return true;
  }

  const haystack = values
    .map((value) => (value || '').toLowerCase())
    .join(' ');
  const tokens = search
    .toLowerCase()
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

  if (tokens.length === 0) {
    return haystack.includes(search.toLowerCase());
  }

  return tokens.every((token) => haystack.includes(token));
};

const matchesRequestedProviders = (
  providerCodes: ProviderCode[],
  values: Array<string | null | undefined>,
): boolean => {
  if (providerCodes.length === 0) {
    return true;
  }

  return providerCodes.some((providerCode) => matchesProviderCode(providerCode, values));
};

const mapDatabaseLab = (
  center: Prisma.DrawCenterGetPayload<{
    include: { laboratory: true };
  }>,
  anchor?: { lat: number; lng: number },
): LabCenterRecord | null => {
  const latitude = center.latitude ? Number(center.latitude) : undefined;
  const longitude = center.longitude ? Number(center.longitude) : undefined;
  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  const address = [center.addressLine1, center.addressLine2, center.city, center.state, center.zipCode]
    .filter(Boolean)
    .join(', ');
  const providerCode = normalizeProviderCode(center.laboratory.code);

  return {
    id: center.id,
    name: center.name,
    address,
    city: center.city,
    state: center.state,
    zip: center.zipCode,
    phone: center.phone || null,
    email: null,
    website: null,
    type: center.appointmentRequired ? 'appointment_required' : 'draw_center',
    hours: center.hours || null,
    status: center.isActive ? 'Open' : 'Closed',
    latitude,
    longitude,
    rating: 0,
    reviewCount: 0,
    isActive: center.isActive,
    lastVerified: center.updatedAt,
    createdAt: center.createdAt,
    updatedAt: center.updatedAt,
    distance: anchor
      ? roundDistance(calculateDistance(anchor.lat, anchor.lng, latitude, longitude))
      : undefined,
    providerCode,
    providerLabel: providerCode
      ? center.laboratory.displayName || PROVIDER_LABELS[providerCode]
      : center.laboratory.displayName || center.laboratory.name,
    source: 'database',
    matchType: 'partner',
    selectionAllowed: true,
  };
};

const mapGoogleLab = (
  lab: LabCenterFromGoogle,
  providerCode: ProviderCode | null = null,
): LabCenterRecord => ({
  id: lab.id,
  name: lab.name,
  address: lab.address,
  city: null,
  state: null,
  zip: null,
  phone: lab.phone,
  email: lab.email,
  website: lab.website,
  type: lab.type,
  hours: lab.hours,
  status: lab.status,
  latitude: lab.latitude,
  longitude: lab.longitude,
  rating: lab.rating,
  reviewCount: lab.reviewCount,
  isActive: lab.isActive,
  lastVerified: lab.lastVerified,
  createdAt: lab.createdAt,
  updatedAt: lab.updatedAt,
  distance: roundDistance(lab.distance),
  providerCode,
  providerLabel: providerCode ? PROVIDER_LABELS[providerCode] : null,
  source: 'places',
  matchType: 'reference',
  selectionAllowed: true,
});

const sortByDistance = (labs: LabCenterRecord[]) =>
  [...labs].sort((a, b) => {
    const aDistance = a.distance ?? Number.MAX_SAFE_INTEGER;
    const bDistance = b.distance ?? Number.MAX_SAFE_INTEGER;
    if (aDistance !== bDistance) {
      return aDistance - bDistance;
    }

    return a.name.localeCompare(b.name);
  });

const mergeUniqueLabs = (primary: LabCenterRecord[], secondary: LabCenterRecord[]) => {
  const seen = new Set(primary.map((lab) => `${lab.name}|${lab.address}`.toLowerCase()));
  const merged = [...primary];

  for (const lab of secondary) {
    const dedupeKey = `${lab.name}|${lab.address}`.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    merged.push(lab);
  }

  return merged;
};

const buildDatabaseWhere = (query: NormalizedQuery): Prisma.DrawCenterWhereInput => {
  const where: Prisma.DrawCenterWhereInput = {
    isVisible: true,
    laboratory: {
      isActive: true,
      isVisibleToCustomers: true,
      ...(query.providerCodes.length > 0 ? { code: { in: query.providerCodes } } : {}),
    },
  };

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  } else {
    where.isActive = true;
  }

  return where;
};

const filterPartnerLabs = (labs: LabCenterRecord[], query: NormalizedQuery) => {
  const filtered = labs.filter((lab) => {
    if (query.status !== 'all' && lab.status !== query.status) {
      return false;
    }

    if (
      query.lat !== undefined &&
      query.lng !== undefined &&
      lab.distance !== undefined &&
      lab.distance > query.radius
    ) {
      return false;
    }

    if (query.providerCodes.length > 0 && !lab.providerCode) {
      return false;
    }

    if (
      query.providerCodes.length > 0 &&
      lab.providerCode &&
      !query.providerCodes.includes(lab.providerCode)
    ) {
      return false;
    }

    return matchesSearch(query.search, [
      lab.name,
      lab.address,
      lab.city,
      lab.state,
      lab.zip,
      lab.providerCode,
      lab.providerLabel,
    ]);
  });

  return sortByDistance(filtered);
};

const filterReferenceLabs = (labs: LabCenterRecord[], query: NormalizedQuery) =>
  sortByDistance(
    labs.filter((lab) => {
      if (query.status !== 'all' && lab.status !== query.status) {
        return false;
      }

      if (
        query.lat !== undefined &&
        query.lng !== undefined &&
        lab.distance !== undefined &&
        lab.distance > query.radius
      ) {
        return false;
      }

      if (!matchesRequestedProviders(query.providerCodes, [lab.name, lab.address])) {
        return false;
      }

      if (!query.search) {
        return true;
      }

      return matchesSearch(query.search, [lab.name, lab.address]);
    }),
  );

const toClientPayload = (lab: LabCenterRecord) => ({
  ...lab,
  searchPreparation: {
    normalizedText: [lab.name, lab.address, lab.city, lab.state, lab.zip, lab.providerLabel]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
    geoPoint: {
      latitude: lab.latitude,
      longitude: lab.longitude,
    },
  },
  lastVerified: lab.lastVerified.toISOString(),
  createdAt: lab.createdAt.toISOString(),
  updatedAt: lab.updatedAt.toISOString(),
});

const getPartnerLabs = async (query: NormalizedQuery): Promise<LabCenterRecord[]> => {
  const anchor =
    query.lat !== undefined && query.lng !== undefined
      ? { lat: query.lat, lng: query.lng }
      : undefined;

  const centers = await prisma.drawCenter.findMany({
    where: buildDatabaseWhere(query),
    include: {
      laboratory: true,
    },
    take: 250,
  });

  const mapped = centers
    .map((center) => mapDatabaseLab(center, anchor))
    .filter((center): center is LabCenterRecord => Boolean(center));

  return filterPartnerLabs(mapped, query);
};

const getFallbackReferenceLabs = async (query: NormalizedQuery): Promise<LabCenterRecord[]> => {
  if (query.lat === undefined || query.lng === undefined || !googlePlacesService.isConfigured()) {
    return [];
  }

  const googleLabs =
    query.providerCodes.length > 0
      ? (
          await Promise.all(
            query.providerCodes.map((providerCode) =>
              googlePlacesService.searchNearbyLabs(query.lat!, query.lng!, query.radius, {
                providerCode,
              }),
            ),
          )
        ).flatMap((labs, index) =>
          labs.map((lab) => mapGoogleLab(lab, query.providerCodes[index])),
        )
      : (await googlePlacesService.searchNearbyLabs(query.lat, query.lng, query.radius)).map((lab) =>
          mapGoogleLab(lab),
        );

  return filterReferenceLabs(mergeUniqueLabs([], googleLabs), query);
};

const getExcludedNationwideStates = async (): Promise<string[]> => {
  const restrictions = await prisma.stateRestriction.findMany({
    where: {
      isActive: true,
      restrictionType: { in: ['BLOCKED', 'REQUIRES_PHYSICIAN'] },
    },
    select: {
      stateCode: true,
    },
  });

  return [...new Set(restrictions.map((restriction) => restriction.stateCode))].sort();
};

const getNationwideCacheKey = (providerCode: ProviderCode, stateCode: string) =>
  `${providerCode}|${stateCode}`;

const getNationwideReferenceLabs = async (
  providerCode: ProviderCode,
  stateCode: string,
): Promise<LabCenterRecord[]> => {
  const cacheKey = getNationwideCacheKey(providerCode, stateCode);
  const cached = nationwideResultsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (!googlePlacesService.isConfigured()) {
    return [];
  }

  const state = US_STATE_CENTERS.find((entry) => entry.code === stateCode);
  if (!state) {
    return [];
  }

  const labs = (
    await googlePlacesService.searchNearbyLabs(state.latitude, state.longitude, FALLBACK_RADIUS_MILES, {
      providerCode,
    })
  )
    .map((lab) => ({
      ...mapGoogleLab(lab, providerCode),
      selectionAllowed: false,
    }))
    .slice(0, 3);

  nationwideResultsCache.set(cacheKey, {
    expiresAt: Date.now() + NATIONWIDE_CACHE_TTL_MS,
    value: labs,
  });

  return labs;
};

const getLabCenters = async (rawQuery: RawLabCenterQuery) => {
  const query = normalizeQuery(rawQuery);
  const partnerLabs = await getPartnerLabs(query);

  let labs = partnerLabs;
  if (partnerLabs.length < PARTNER_RESULTS_TARGET) {
    try {
      const referenceLabs = await getFallbackReferenceLabs(query);
      labs = mergeUniqueLabs(partnerLabs, referenceLabs);
    } catch {
      labs = partnerLabs;
    }
  }

  return labs.slice(0, MAX_RESULTS).map(toClientPayload);
};

const getNationwideLabCenters = async (rawQuery: RawNationwideQuery): Promise<NationwideResult> => {
  const query = normalizeNationwideQuery(rawQuery);

  if (query.country !== 'US' && query.country !== 'USA') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only US nationwide search is supported');
  }

  const excludedStates = await getExcludedNationwideStates();
  const allowedStates = US_STATE_CENTERS.filter((state) => !excludedStates.includes(state.code));
  const pairs = query.providers.flatMap((providerCode) =>
    allowedStates.map((state) => ({
      providerCode,
      stateCode: state.code,
      stateName: state.name,
    })),
  );

  const totalGroups = pairs.length;
  const startIndex = (query.page - 1) * query.pageSize;
  const pagedPairs = pairs.slice(startIndex, startIndex + query.pageSize);

  const groups = await Promise.all(
    pagedPairs.map(async (pair) => ({
      stateCode: pair.stateCode,
      stateName: pair.stateName,
      providerCode: pair.providerCode,
      providerLabel: PROVIDER_LABELS[pair.providerCode],
      sampleLabs: (await getNationwideReferenceLabs(pair.providerCode, pair.stateCode)).map(
        toClientPayload,
      ),
      source: 'places' as const,
      matchType: 'reference' as const,
    })),
  );

  return {
    groups,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      totalGroups,
      excludedStates,
    },
  };
};

const getLabCenterById = async (labCenterId: string) => {
  const drawCenter = await prisma.drawCenter.findUnique({
    where: { id: labCenterId },
    include: {
      laboratory: true,
    },
  });

  if (!drawCenter) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lab center not found');
  }

  const mapped = mapDatabaseLab(drawCenter);
  if (!mapped) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lab center coordinates are unavailable');
  }

  return toClientPayload(mapped);
};

const geocodeAddress = async (address: string) => googlePlacesService.geocodeAddress(address);

const autocompleteLocations = async (input: string): Promise<PlaceAutocompleteSuggestion[]> => {
  if (!googlePlacesService.isConfigured()) {
    return [];
  }

  return googlePlacesService.autocompleteLocations(input);
};

const getPlaceDetails = async (placeId: string): Promise<PlaceDetailsResult | ReturnType<typeof toClientPayload>> => {
  const drawCenter = await prisma.drawCenter.findUnique({
    where: { id: placeId },
    include: {
      laboratory: true,
    },
  });

  if (drawCenter) {
    const mapped = mapDatabaseLab(drawCenter);
    if (!mapped) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Lab center coordinates are unavailable');
    }

    return toClientPayload(mapped);
  }

  if (!googlePlacesService.isConfigured()) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Google Places API is not configured');
  }

  return googlePlacesService.getPlaceDetails(placeId);
};

export const LabCenterServices = {
  autocompleteLocations,
  geocodeAddress,
  getLabCenterById,
  getLabCenters,
  getNationwideLabCenters,
  getPlaceDetails,
};
