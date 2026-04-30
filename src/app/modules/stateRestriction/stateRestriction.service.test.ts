jest.mock('../../../config/env', () => ({
  env: {
    PUBLIC_IP_LOOKUP_URL_TEMPLATE: 'https://api.ipify.org?format=json',
    PUBLIC_IP_LOOKUP_TIMEOUT_MS: 3000,
    IP_GEOLOOKUP_URL_TEMPLATE: 'https://ipwho.is/{ip}',
    IP_GEOLOOKUP_TIMEOUT_MS: 3000,
  },
}));

jest.mock('../../../config/db', () => ({
  prisma: {
    laboratory: {
      findUnique: jest.fn(),
    },
    stateRestriction: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    test: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import axios from 'axios';
import { prisma } from '../../../config/db';
import stateRestrictionService from './stateRestriction.service';

const mockedPrisma = prisma as unknown as {
  laboratory: {
    findUnique: jest.Mock;
  };
  stateRestriction: {
    findFirst: jest.Mock;
  };
};

const mockedAxios = axios as unknown as {
  get: jest.Mock;
};

describe('stateRestrictionService location status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: { ip: null } });
    mockedPrisma.laboratory.findUnique.mockImplementation(
      async ({ where }: { where: { id?: string; code?: string } }) => {
        if (where.id === 'lab-cpl' || where.code === 'CPL') {
          return { id: 'lab-cpl', code: 'CPL' };
        }

        if (where.id === 'lab-access' || where.code === 'ACCESS') {
          return { id: 'lab-access', code: 'ACCESS' };
        }

        return null;
      },
    );
  });

  it('uses checkout state override and defaults the lab route to ACCESS', async () => {
    mockedPrisma.stateRestriction.findFirst.mockImplementation(
      async ({ where }: { where: { stateCode: string; laboratoryId: string; testId: string } }) => {
        if (
          where.stateCode === 'NY' &&
          where.laboratoryId === 'lab-access' &&
          where.testId === 'test-1'
        ) {
          return {
            restrictionType: 'BLOCKED',
            laboratory: { id: 'lab-access', code: 'ACCESS' },
          };
        }

        return null;
      },
    );

    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers: {
          'x-vercel-ip-country': 'US',
          'x-vercel-ip-country-region': 'CA',
        },
        ip: '203.0.113.2',
      } as any,
      checkoutState: 'ny',
      testId: 'test-1',
    });

    expect(result).toMatchObject({
      detectedStateCode: 'CA',
      effectiveStateCode: 'NY',
      laboratoryRoute: 'ACCESS',
      restrictionType: 'BLOCKED',
      canOrder: false,
      source: 'checkout_state',
      ip: '203.0.113.2',
      maskedIp: '203.xxx.xxx.2',
    });
  });

  it('honors explicit laboratory route overrides', async () => {
    mockedPrisma.stateRestriction.findFirst.mockImplementation(
      async ({
        where,
      }: {
        where: { stateCode: string; laboratoryId: string | null; testId: string | null };
      }) => {
        if (
          where.stateCode === 'MD' &&
          where.laboratoryId === 'lab-cpl' &&
          where.testId === null
        ) {
          return {
            restrictionType: 'REQUIRES_PHYSICIAN',
            laboratory: { id: 'lab-cpl', code: 'CPL' },
          };
        }

        return null;
      },
    );

    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers: {
          'x-vercel-ip-country': 'US',
          'x-vercel-ip-country-region': 'MD',
        },
        ip: '198.51.100.8',
      } as any,
      checkoutState: 'MD',
      laboratoryCode: 'cpl',
    });

    expect(result).toMatchObject({
      effectiveStateCode: 'MD',
      laboratoryRoute: 'CPL',
      restrictionType: 'REQUIRES_PHYSICIAN',
      canOrder: false,
      source: 'checkout_state',
    });
  });

  it('falls back to generic state rules when no lab-specific restriction matches', async () => {
    mockedPrisma.stateRestriction.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        restrictionType: 'BLOCKED',
        laboratory: null,
      });

    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers: {
          'x-vercel-ip-country': 'US',
          'x-vercel-ip-country-region': 'NJ',
        },
        ip: '198.51.100.9',
      } as any,
      checkoutState: 'NJ',
      testId: 'test-2',
    });

    expect(result).toMatchObject({
      effectiveStateCode: 'NJ',
      laboratoryRoute: 'ACCESS',
      restrictionType: 'BLOCKED',
      canOrder: false,
    });
  });

  it('returns a safe allowed response when no geo signal is available', async () => {
    mockedAxios.get.mockResolvedValue({ data: { ip: null } });

    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers: {},
        ip: '127.0.0.1',
      } as any,
    });

    expect(result).toMatchObject({
      ip: '127.0.0.1',
      detectedStateCode: null,
      effectiveStateCode: null,
      laboratoryRoute: 'ACCESS',
      restrictionType: null,
      canOrder: true,
      source: 'unknown',
      maskedIp: '127.xxx.xxx.1',
    });
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.stateRestriction.findFirst).not.toHaveBeenCalled();
  });

  it('uses the external public ip fallback to derive region when request ip is local', async () => {
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url === 'https://api.ipify.org?format=json') {
        return { data: { ip: '203.0.113.24' } };
      }

      if (url === 'https://ipwho.is/203.0.113.24') {
        return {
          data: {
            success: true,
            country_code: 'US',
            region_code: 'CA',
          },
        };
      }

      return { data: {} };
    });

    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers: {},
        ip: '127.0.0.1',
      } as any,
    });

    expect(result).toMatchObject({
      ip: '203.0.113.24',
      maskedIp: '203.xxx.xxx.24',
      detectedStateCode: 'CA',
      effectiveStateCode: 'CA',
      laboratoryRoute: 'ACCESS',
      restrictionType: null,
      canOrder: true,
      source: 'ip_lookup',
    });
  });

  it('prefers an explicit public ip override when provided', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        country_code: 'US',
        region_code: 'FL',
      },
    });

    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers: {},
        ip: '127.0.0.1',
      } as any,
      publicIp: '203.0.113.77',
    });

    expect(result).toMatchObject({
      ip: '203.0.113.77',
      maskedIp: '203.xxx.xxx.77',
      detectedStateCode: 'FL',
      effectiveStateCode: 'FL',
      source: 'ip_lookup',
    });
    expect(mockedAxios.get).toHaveBeenCalledWith('https://ipwho.is/203.0.113.77', {
      timeout: 3000,
    });
  });
});
