jest.mock('../../../shared/prisma', () => ({
  __esModule: true,
  default: {
    drawCenter: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    stateRestriction: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../services/google-places.service', () => ({
  googlePlacesService: {
    isConfigured: jest.fn(),
    searchNearbyLabs: jest.fn(),
    autocompleteLocations: jest.fn(),
    geocodeAddress: jest.fn(),
    getPlaceDetails: jest.fn(),
  },
}));

import prisma from '../../../shared/prisma';
import { googlePlacesService } from '../../services/google-places.service';
import { LabCenterServices } from './lab-centers.service';

const mockedPrisma = prisma as unknown as {
  drawCenter: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
  stateRestriction: {
    findMany: jest.Mock;
  };
};

const mockedGooglePlacesService = googlePlacesService as unknown as {
  isConfigured: jest.Mock;
  searchNearbyLabs: jest.Mock;
};

const buildGoogleLab = (name: string) => ({
  id: `${name.toLowerCase().replace(/\s+/g, '-')}-id`,
  name,
  address: `${name} Address`,
  phone: null,
  email: null,
  website: null,
  type: 'medical_laboratory',
  hours: null,
  status: 'Open',
  latitude: 34.0522,
  longitude: -118.2437,
  rating: 4.7,
  reviewCount: 20,
  isActive: true,
  lastVerified: new Date('2026-01-01T00:00:00.000Z'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  distance: 12.4,
});

describe('lab center services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.drawCenter.findMany.mockResolvedValue([]);
    mockedPrisma.stateRestriction.findMany.mockResolvedValue([]);
    mockedGooglePlacesService.isConfigured.mockReturnValue(true);
    mockedGooglePlacesService.searchNearbyLabs.mockResolvedValue([]);
  });

  it('applies provider filtering to the local database query', async () => {
    await LabCenterServices.getLabCenters({
      lat: '34.05',
      lng: '-118.24',
      radius: '25',
      providerCode: 'ACCESS',
    });

    expect(mockedPrisma.drawCenter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          laboratory: expect.objectContaining({
            code: { in: ['ACCESS'] },
          }),
        }),
      }),
    );
  });

  it('uses provider-specific Places fallback for local searches', async () => {
    mockedGooglePlacesService.searchNearbyLabs.mockResolvedValueOnce([
      buildGoogleLab('Quest Diagnostics Sample'),
    ]);

    const result = await LabCenterServices.getLabCenters({
      lat: '34.05',
      lng: '-118.24',
      radius: '25',
      providerCode: 'QUEST',
    });

    expect(mockedGooglePlacesService.searchNearbyLabs).toHaveBeenCalledWith(
      34.05,
      -118.24,
      25,
      { providerCode: 'QUEST' },
    );
    expect(result).toEqual([
      expect.objectContaining({
        providerCode: 'QUEST',
        providerLabel: 'Quest Diagnostics',
        source: 'places',
        matchType: 'reference',
      }),
    ]);
  });

  it('returns nationwide groups outside restricted states with reference-only sample labs', async () => {
    mockedPrisma.stateRestriction.findMany.mockResolvedValue([
      { stateCode: 'NY' },
      { stateCode: 'NJ' },
      { stateCode: 'RI' },
      { stateCode: 'MD' },
      { stateCode: 'MA' },
    ]);
    mockedGooglePlacesService.searchNearbyLabs.mockImplementation(
      async (
        _lat: number,
        _lng: number,
        _radius: number,
        options?: { providerCode?: string },
      ) => [buildGoogleLab(`${options?.providerCode} Reference Lab`)],
    );

    const result = await LabCenterServices.getNationwideLabCenters({
      country: 'US',
      providers: 'QUEST',
      page: '1',
      pageSize: '3',
    });

    expect(result.meta.excludedStates).toEqual(['MA', 'MD', 'NJ', 'NY', 'RI']);
    expect(result.groups).toHaveLength(3);
    expect(result.groups.every((group) => group.providerCode === 'QUEST')).toBe(
      true,
    );
    expect(
      result.groups.every(
        (group) => !['MA', 'MD', 'NJ', 'NY', 'RI'].includes(group.stateCode),
      ),
    ).toBe(true);
    expect(result.groups[0]).toEqual(
      expect.objectContaining({
        providerCode: 'QUEST',
        providerLabel: 'Quest Diagnostics',
        source: 'places',
        matchType: 'reference',
      }),
    );
    expect(result.groups[0].sampleLabs[0]).toEqual(
      expect.objectContaining({
        selectionAllowed: false,
        source: 'places',
        matchType: 'reference',
      }),
    );
  });
});
