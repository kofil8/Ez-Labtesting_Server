import axios from 'axios';
import httpStatus from 'http-status';
import { env } from '../../config/env';
import ApiError from '../errors/ApiErrors';
import { PROVIDER_LABELS, ProviderCode } from '../modules/lab-centers/providers';

const METERS_PER_MILE = 1609.34;
const MAX_NEARBY_RADIUS_METERS = 50000; // Google caps at 50km

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  business_status?: string;
  types?: string[];
}

interface NearbySearchResponse {
  status: string;
  results: GooglePlace[];
  error_message?: string;
  next_page_token?: string;
}

interface GoogleAutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

interface AutocompleteResponse {
  status: string;
  predictions: GoogleAutocompletePrediction[];
  error_message?: string;
}

interface PlaceDetailsResponse {
  status: string;
  result?: {
    place_id: string;
    name?: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    website?: string;
    opening_hours?: {
      open_now?: boolean;
      weekday_text?: string[];
    };
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
    user_ratings_total?: number;
  };
  error_message?: string;
}

interface GeocodeResponse {
  status: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
  }>;
  error_message?: string;
}

type SearchNearbyLabsOptions = {
  providerCode?: ProviderCode;
};

export interface PlaceAutocompleteSuggestion {
  placeId: string;
  mainText: string;
  secondaryText?: string;
  description: string;
}

export interface PlaceDetailsResult {
  id: string;
  name?: string;
  address?: string;
  phone?: string | null;
  website?: string | null;
  hours?: string | null;
  status?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface LabCenterFromGoogle {
  id: string;
  name: string;
  address: string;
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
  distance: number;
}

/**
 * Google Places API service for real-time medical lab/pharmacy search
 * Fetches live data from Google Maps instead of database
 */
class GooglePlacesService {
  private apiKey: string;
  private baseURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  private autocompleteURL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
  private placeDetailsURL = 'https://maps.googleapis.com/maps/api/place/details/json';
  private geocodeURL = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor() {
    this.apiKey = env.GOOGLE_MAPS_API_KEY;
    if (!this.apiKey) {
      console.warn(
        '[GooglePlacesService] GOOGLE_MAPS_API_KEY not configured - will fall back to database',
      );
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula (in miles)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  }

  /**
   * Convert Google Place to LabCenter format
   */
  private googlePlaceToLabCenter(place: GooglePlace, distance: number): LabCenterFromGoogle {
    const isOpen = place.opening_hours?.open_now !== false;

    return {
      id: place.place_id || `gplace_${place.name.replace(/\s+/g, '_')}`,
      name: place.name,
      address: place.formatted_address || place.vicinity || '',
      phone: null,
      email: null,
      website: null,
      type: 'medical_laboratory',
      hours: null,
      status: isOpen ? 'Open' : 'Closed',
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      isActive: true,
      lastVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
    };
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search for medical labs/pharmacies near a location using Google Places Nearby Search API
   * Returns live data from Google Maps
   */
  async searchNearbyLabs(
    lat: number,
    lng: number,
    radiusMiles: number = 25,
    options: SearchNearbyLabsOptions = {},
  ): Promise<LabCenterFromGoogle[]> {
    if (!this.apiKey) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Google Maps API key not configured');
    }

    const radiusMeters = Math.min(
      Math.max(radiusMiles, 1) * METERS_PER_MILE,
      MAX_NEARBY_RADIUS_METERS,
    );

    console.log(
      `[GooglePlacesService] Searching for labs near (${lat}, ${lng}) with radius ${radiusMiles} miles`,
    );

    try {
      const providerLabel = options.providerCode ? PROVIDER_LABELS[options.providerCode] : null;
      const params = {
        key: this.apiKey,
        location: `${lat},${lng}`,
        radius: Math.floor(radiusMeters),
        keyword: providerLabel
          ? `${providerLabel} medical laboratory blood test diagnostics clinic pharmacy`
          : 'medical laboratory blood test diagnostics clinic pharmacy',
        type: 'health',
      };

      console.log('[GooglePlacesService] Calling Google Places API...');
      const response = await axios.get<NearbySearchResponse>(this.baseURL, { params });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.error('[GooglePlacesService] API Error:', response.data.error_message);
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Google Places API error: ${response.data.error_message}`,
        );
      }

      if (!response.data.results || response.data.results.length === 0) {
        console.log('[GooglePlacesService] No results found');
        return [];
      }

      // Convert results to LabCenter format with distance calculations
      const labs = response.data.results
        .map((place) => {
          const distance = this.calculateDistance(
            lat,
            lng,
            place.geometry.location.lat,
            place.geometry.location.lng,
          );
          return this.googlePlaceToLabCenter(place, distance);
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 50); // Limit to 50 results for performance

      console.log(`[GooglePlacesService] Found ${labs.length} labs from Google Places`);
      return labs;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('[GooglePlacesService] Error:', error);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to search labs. Please try again later.',
      );
    }
  }

  async autocompleteLocations(query: string): Promise<PlaceAutocompleteSuggestion[]> {
    if (!this.apiKey) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Google Maps API key not configured');
    }

    const search = query.trim();
    if (!search) {
      return [];
    }

    try {
      const response = await axios.get<AutocompleteResponse>(this.autocompleteURL, {
        params: {
          key: this.apiKey,
          input: search,
          types: '(regions)',
        },
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          response.data.error_message ||
            `Places autocomplete failed with status ${response.data.status}`,
        );
      }

      return (response.data.predictions || []).slice(0, 8).map((prediction) => ({
        placeId: prediction.place_id,
        mainText: prediction.structured_formatting?.main_text || prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text,
        description: prediction.description,
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to fetch location suggestions. Please try again.',
      );
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult> {
    if (!this.apiKey) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Google Maps API key not configured');
    }

    const id = placeId.trim();
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'placeId is required');
    }

    try {
      const response = await axios.get<PlaceDetailsResponse>(this.placeDetailsURL, {
        params: {
          key: this.apiKey,
          place_id: id,
          fields:
            'place_id,name,formatted_address,formatted_phone_number,website,opening_hours,geometry,rating,user_ratings_total',
        },
      });

      if (response.data.status !== 'OK' || !response.data.result) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          response.data.error_message || `Place details failed with status ${response.data.status}`,
        );
      }

      const details = response.data.result;
      const openNow = details.opening_hours?.open_now;
      return {
        id: details.place_id,
        name: details.name,
        address: details.formatted_address,
        phone: details.formatted_phone_number || null,
        website: details.website || null,
        hours: details.opening_hours?.weekday_text?.join(' | ') || null,
        status: openNow === undefined ? undefined : openNow ? 'Open' : 'Closed',
        latitude: details.geometry?.location?.lat,
        longitude: details.geometry?.location?.lng,
        rating: details.rating,
        reviewCount: details.user_ratings_total,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch place details');
    }
  }

  async geocodeAddress(address: string): Promise<GeocodeResult> {
    if (!this.apiKey) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Google Maps API key not configured');
    }

    const query = address.trim();
    if (!query) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'address is required');
    }

    try {
      const response = await axios.get<GeocodeResponse>(this.geocodeURL, {
        params: {
          key: this.apiKey,
          address: query,
        },
      });

      if (response.data.status !== 'OK' || !response.data.results?.length) {
        if (response.data.status === 'ZERO_RESULTS') {
          throw new ApiError(httpStatus.BAD_REQUEST, 'We could not find that location');
        }

        throw new ApiError(
          httpStatus.BAD_REQUEST,
          response.data.error_message || `Geocoding failed with status ${response.data.status}`,
        );
      }

      const result = response.data.results[0];
      const location = result.geometry?.location;
      if (!location) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Geocoding response did not include coordinates');
      }

      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address || query,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to geocode location');
    }
  }

  /**
   * Filter labs by various criteria
   */
  filterLabs(
    labs: LabCenterFromGoogle[],
    options: {
      radiusMiles?: number;
      type?: string;
      status?: string;
      maxResults?: number;
    },
  ): LabCenterFromGoogle[] {
    let filtered = [...labs];

    // Filter by radius
    if (options.radiusMiles !== undefined && options.radiusMiles > 0) {
      filtered = filtered.filter((lab) => lab.distance <= options.radiusMiles!);
    }

    // Filter by type
    if (options.type && options.type !== 'all') {
      filtered = filtered.filter((lab) => lab.type === options.type);
    }

    // Filter by status
    if (options.status && options.status !== 'all') {
      filtered = filtered.filter((lab) => lab.status === options.status);
    }

    // Limit results
    if (options.maxResults) {
      filtered = filtered.slice(0, options.maxResults);
    }

    return filtered;
  }
}

export const googlePlacesService = new GooglePlacesService();
