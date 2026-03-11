import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import ApiError from '../../errors/ApiErrors';
import { googlePlacesService } from '../../services/google-places.service';
import { fallbackLabCenters } from './lab-centers.seed';
import {
  ICreateLabCenter,
  IGeocodeResponse,
  ILabCenterQuery,
  ILabCenterWithDistance,
  IUpdateLabCenter,
} from './lab-centers.types';

// Haversine formula to calculate distance in miles
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const normalizeSearchTerm = (search?: string) => {
  if (!search) return '';
  const trimmed = search.trim().toLowerCase();
  if (!trimmed) return '';
  const cityLike = trimmed.split(',')[0]?.trim();
  return cityLike || trimmed;
};

const matchesSearchTerm = (
  center: { name: string; address: string; type: string },
  normalizedSearch: string,
) => {
  if (!normalizedSearch) return true;

  const haystack = `${center.name} ${center.address} ${center.type}`.toLowerCase();
  return haystack.includes(normalizedSearch);
};

const mergeById = (primary: ILabCenterWithDistance[], secondary: ILabCenterWithDistance[]) => {
  const map = new Map<string, ILabCenterWithDistance>();
  [...primary, ...secondary].forEach((center) => {
    map.set(center.id, center);
  });

  return Array.from(map.values()).sort((a, b) => a.distance - b.distance);
};

const getFallbackCenters = (query: ILabCenterQuery): ILabCenterWithDistance[] => {
  const { lat, lng, radius = '50', search, type, status, isActive = 'true' } = query;
  const isActiveBool = isActive === 'true';
  const normalizedSearch = normalizeSearchTerm(search);

  let centers = fallbackLabCenters.filter((center) => center.isActive === isActiveBool);

  if (type && type !== 'all') {
    centers = centers.filter((center) => center.type === type);
  }

  if (status && status !== 'all') {
    centers = centers.filter((center) => center.status === status);
  }

  if (lat && lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMiles = parseFloat(radius);

    // Calculate distances for ALL centers
    const centersWithDistance = centers
      .map((center) => ({
        ...center,
        distance:
          Math.round(
            calculateDistance(latitude, longitude, center.latitude, center.longitude) * 10,
          ) / 10,
      }))
      .sort((a, b) => a.distance - b.distance);

    const cityMatches = normalizedSearch
      ? centersWithDistance.filter((center) => matchesSearchTerm(center, normalizedSearch))
      : [];

    // First try to get labs within radius
    const nearbyLabs = centersWithDistance.filter((center) => center.distance <= radiusMiles);

    if (cityMatches.length > 0) {
      return mergeById(cityMatches, nearbyLabs);
    }

    // If labs found within radius, return them; otherwise return ALL labs sorted by distance
    return nearbyLabs.length > 0 ? nearbyLabs : centersWithDistance;
  }

  if (normalizedSearch) {
    centers = centers.filter((center) => matchesSearchTerm(center, normalizedSearch));
  }

  return centers
    .map((center) => ({
      ...center,
      distance: 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Get lab centers with distance filtering - prioritize Google Places API for real-time data
const getLabCentersDB = async (query: ILabCenterQuery): Promise<ILabCenterWithDistance[]> => {
  const { lat, lng, radius = '50', search, type, status, isActive = 'true' } = query;
  const normalizedSearch = normalizeSearchTerm(search);

  console.log('[LabCenterService] Query received:', {
    lat,
    lng,
    radius,
    search,
    type,
    status,
  });

  // Try Google Places API first if lat/lng provided and API is configured
  if (lat && lng && googlePlacesService.isConfigured()) {
    try {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusMiles = parseFloat(radius);

      console.log('[LabCenterService] Attempting Google Places API search...');
      const googleResults = await googlePlacesService.searchNearbyLabs(
        latitude,
        longitude,
        radiusMiles,
      );

      if (googleResults && googleResults.length > 0) {
        // Convert Google Places results to ILabCenterWithDistance format
        let results = googleResults as unknown as ILabCenterWithDistance[];

        // Filter by status if needed
        if (status && status !== 'all') {
          results = results.filter((lab) => lab.status === status);
        }

        // Filter by type if needed
        if (type && type !== 'all') {
          results = results.filter((lab) => lab.type === type);
        }

        console.log(
          `[LabCenterService] Google Places returned ${results.length} labs (filtered: ${googleResults.length})`,
        );
        return results;
      }
      console.log('[LabCenterService] Google Places returned no results, falling back to database');
    } catch (error) {
      console.error('[LabCenterService] Google Places API error:', error);
      console.log('[LabCenterService] Falling back to database...');
      // Fall through to database lookup
    }
  }

  // Fallback to database

  // Build where clause
  const whereClause: any = {
    isActive: isActive === 'true',
  };

  // Only add type/status filter if provided AND not 'all'
  if (type && type !== 'all') {
    whereClause.type = type;
    console.log('[LabCenterService] Filtering by type:', type);
  }

  if (status && status !== 'all') {
    whereClause.status = status;
    console.log('[LabCenterService] Filtering by status:', status);
  }

  const totalActiveCenters = await prisma.labCenter.count({
    where: { isActive: isActive === 'true' },
  });

  console.log('[LabCenterService] Total active centers in DB:', totalActiveCenters);

  if (totalActiveCenters === 0) {
    console.log('[LabCenterService] No DB centers found, using fallback');
    return getFallbackCenters(query);
  }

  // If lat/lng provided, calculate distances using Haversine formula
  if (lat && lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMiles = parseFloat(radius);

    console.log('[LabCenterService] Searching with location:', {
      latitude,
      longitude,
      radiusMiles,
    });

    // Get all centers matching the filters
    const allCenters = await prisma.labCenter.findMany({
      where: whereClause,
    });

    console.log('[LabCenterService] Found DB centers:', allCenters.length);

    // Calculate distances for ALL centers
    const centersWithDistance = allCenters
      .map((center) => ({
        ...center,
        distance:
          Math.round(
            calculateDistance(latitude, longitude, center.latitude, center.longitude) * 10,
          ) / 10,
      }))
      .sort((a, b) => a.distance - b.distance);

    const cityMatches = normalizedSearch
      ? centersWithDistance.filter((center) => matchesSearchTerm(center, normalizedSearch))
      : [];

    // First try to get labs within radius
    const nearbyLabs = centersWithDistance.filter((center) => center.distance <= radiusMiles);

    if (cityMatches.length > 0) {
      const merged = mergeById(cityMatches, nearbyLabs);
      console.log('[LabCenterService] Found city + nearby labs:', merged.length);
      return merged;
    }

    // If labs found within radius, return them; otherwise return ALL labs sorted by distance
    if (nearbyLabs.length > 0) {
      console.log('[LabCenterService] Found nearby labs:', nearbyLabs.length);
      return nearbyLabs;
    } else {
      console.log('[LabCenterService] No nearby labs, returning all sorted by distance');
      return centersWithDistance;
    }
  }

  // No location provided, return all active centers
  console.log('[LabCenterService] No location provided, returning all centers');
  let centers = await prisma.labCenter.findMany({
    where: whereClause,
    orderBy: { name: 'asc' },
  });

  if (normalizedSearch) {
    centers = centers.filter((center) => matchesSearchTerm(center, normalizedSearch));
  }

  return centers.map((center) => ({
    ...center,
    distance: 0,
  }));
};

// Get single lab center by ID
const getLabCenterByIdDB = async (id: string): Promise<ILabCenterWithDistance> => {
  const labCenter = await prisma.labCenter.findUnique({
    where: { id },
  });

  if (!labCenter) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lab center not found');
  }

  return {
    ...labCenter,
    distance: 0,
  };
};

// Create new lab center (admin only)
const createLabCenterInDB = async (data: ICreateLabCenter): Promise<ILabCenterWithDistance> => {
  const labCenter = await prisma.labCenter.create({
    data: {
      ...data,
      lastVerified: new Date(),
    },
  });

  return {
    ...labCenter,
    distance: 0,
  };
};

// Update lab center (admin only)
const updateLabCenterInDB = async (
  id: string,
  data: IUpdateLabCenter,
): Promise<ILabCenterWithDistance> => {
  const existingCenter = await prisma.labCenter.findUnique({
    where: { id },
  });

  if (!existingCenter) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lab center not found');
  }

  const updatedCenter = await prisma.labCenter.update({
    where: { id },
    data: {
      ...data,
      lastVerified: data.lastVerified ? new Date(data.lastVerified) : new Date(),
      updatedAt: new Date(),
    },
  });

  return {
    ...updatedCenter,
    distance: 0,
  };
};

// Delete lab center (admin only)
const deleteLabCenterFromDB = async (id: string): Promise<void> => {
  const existingCenter = await prisma.labCenter.findUnique({
    where: { id },
  });

  if (!existingCenter) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lab center not found');
  }

  // Soft delete by setting isActive to false
  await prisma.labCenter.update({
    where: { id },
    data: { isActive: false },
  });
};

// Geocode address using Google Maps API
const geocodeAddress = async (address: string): Promise<IGeocodeResponse> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Google Maps API key not configured');
  }

  // Validate and trim address
  if (!address || address.trim().length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Address is required and cannot be empty');
  }

  try {
    const trimmedAddress = address.trim();
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmedAddress)}&key=${apiKey}`;

    console.log(`[Geocoding] Attempting to geocode: "${trimmedAddress}"`);

    const response = await fetch(url);
    const data = await response.json();

    console.log(`[Geocoding] Google Maps API response status: ${data.status}`);

    // Check for API errors
    if (data.status === 'REQUEST_DENIED') {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Google Maps API key is invalid or restricted',
      );
    }

    if (data.status === 'RATE_LIMIT_EXCEEDED') {
      throw new ApiError(
        httpStatus.TOO_MANY_REQUESTS,
        'Geocoding service is temporarily unavailable. Please try again later.',
      );
    }

    if (data.status === 'ZERO_RESULTS') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Address "${trimmedAddress}" not found. Please check the address and try again.`,
      );
    }

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Unable to geocode "${trimmedAddress}". Please try a different address format (e.g., "Las Vegas, Nevada" or "90210").`,
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;

    console.log(`[Geocoding] Success: ${trimmedAddress} -> (${location.lat}, ${location.lng})`);

    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error('[Geocoding Error]', error);

    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Geocoding service error. Please try again later.',
    );
  }
};

const autocompleteLocations = async (input: string) => {
  if (!googlePlacesService.isConfigured()) {
    return [];
  }

  return googlePlacesService.autocompleteLocations(input);
};

const getGooglePlaceDetails = async (placeId: string) => {
  if (!googlePlacesService.isConfigured()) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Google Places API not configured');
  }

  return googlePlacesService.getPlaceDetails(placeId);
};

export const LabCenterServices = {
  getLabCentersDB,
  getLabCenterByIdDB,
  createLabCenterInDB,
  updateLabCenterInDB,
  deleteLabCenterFromDB,
  geocodeAddress,
  autocompleteLocations,
  getGooglePlaceDetails,
};
