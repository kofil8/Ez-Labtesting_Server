jest.mock('../../../config/env', () => ({
  env: {
    PUBLIC_IP_LOOKUP_URL_TEMPLATE: 'https://api.ipify.org?format=json',
    PUBLIC_IP_LOOKUP_TIMEOUT_MS: 3000,
    NODE_ENV: 'test',
    IP_GEO_PROVIDER: 'ipinfo',
    IPINFO_TOKEN: 'test-token',
    IP_GEOLOOKUP_URL_TEMPLATE: 'https://ipwho.is/{ip}',
    IP_GEOLOOKUP_TIMEOUT_MS: 3000,
    IP_GEO_CACHE_TTL_SECONDS: 86400,
    RESTRICTION_TEST_STATE: '',
    RESTRICTION_TEST_IP: '',
    ALLOW_PRODUCTION_RESTRICTION_TEST_OVERRIDE: false,
  },
}));

jest.mock('../../../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
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
import redisClient from '../../../config/redis';
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

const mockedRedis = redisClient as unknown as {
  get: jest.Mock;
  set: jest.Mock;
};

describe('stateRestrictionService location status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: { ip: null } });
    mockedRedis.get.mockResolvedValue(null);
    mockedRedis.set.mockResolvedValue('OK');
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
      countryCode: 'US',
      regionCode: 'CA',
      regionName: 'California',
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

  it('returns a safe allowed response when no trustworthy public ip is available', async () => {
    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers: {},
        ip: '127.0.0.1',
      } as any,
    });

    expect(result).toMatchObject({
      ip: null,
      detectedStateCode: null,
      effectiveStateCode: null,
      laboratoryRoute: 'ACCESS',
      restrictionType: null,
      canOrder: true,
      source: 'unknown',
      maskedIp: null,
    });
    expect(mockedAxios.get).not.toHaveBeenCalled();
    expect(mockedPrisma.stateRestriction.findFirst).not.toHaveBeenCalled();
  });

  it('does not use the backend public ip as a visitor fallback', async () => {
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
      ip: null,
      maskedIp: null,
      detectedStateCode: null,
      effectiveStateCode: null,
      laboratoryRoute: 'ACCESS',
      restrictionType: null,
      canOrder: true,
      source: 'unknown',
    });
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it.each([
    ['x-real-ip', { 'x-real-ip': '198.51.100.11' }, '198.51.100.11'],
    [
      'first x-forwarded-for value',
      { 'x-forwarded-for': '198.51.100.12, 10.0.0.2' },
      '198.51.100.12',
    ],
  ])('resolves visitor ip from %s', async (_label, headers, expectedIp) => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        country_code: 'US',
        region_code: 'TX',
        region: 'Texas',
        city: 'Austin',
      },
    });

    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers,
        ip: '127.0.0.1',
      } as any,
    });

    expect(result).toMatchObject({
      ip: expectedIp,
      maskedIp: `${expectedIp.split('.')[0]}.xxx.xxx.${expectedIp.split('.')[3]}`,
      detectedStateCode: 'TX',
      effectiveStateCode: 'TX',
      source: 'ip_lookup',
      countryCode: 'US',
      regionCode: 'TX',
      regionName: 'Texas',
      city: 'Austin',
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(`https://api.ipinfo.io/lookup/${expectedIp}?token=test-token`, {
      timeout: 3000,
    });
    expect(mockedAxios.get).not.toHaveBeenCalledWith('https://api.ipify.org?format=json', {
      timeout: 3000,
    });
  });

  it('prefers an explicit public ip override when provided', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        country_code: 'US',
        region_code: 'FL',
        region: 'Florida',
        city: 'Miami',
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
      countryCode: 'US',
      regionCode: 'FL',
      regionName: 'Florida',
      city: 'Miami',
    });
    expect(mockedAxios.get).toHaveBeenCalledWith('https://api.ipinfo.io/lookup/203.0.113.77?token=test-token', {
      timeout: 3000,
    });
  });

  it('falls back to ipwhois when ipinfo lookup fails', async () => {
    mockedAxios.get
      .mockRejectedValueOnce(new Error('ipinfo unavailable'))
      .mockResolvedValueOnce({
        data: {
          success: true,
          country_code: 'US',
          region_code: 'NY',
          region: 'New York',
          city: 'New York City',
        },
      });

    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers: {},
        ip: '127.0.0.1',
      } as any,
      publicIp: '169.197.141.249',
      laboratoryCode: 'ACCESS',
    });

    expect(result).toMatchObject({
      detectedStateCode: 'NY',
      effectiveStateCode: 'NY',
      countryCode: 'US',
      regionCode: 'NY',
      regionName: 'New York',
      city: 'New York City',
      source: 'ip_lookup',
    });
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://ipwho.is/169.197.141.249',
      { timeout: 3000 },
    );
  });

  it('falls back to ip-api when ipinfo and ipwhois fail', async () => {
    mockedAxios.get
      .mockRejectedValueOnce(new Error('ipinfo unavailable'))
      .mockRejectedValueOnce(new Error('ipwhois unavailable'))
      .mockResolvedValueOnce({
        data: {
          status: 'success',
          countryCode: 'US',
          region: 'NJ',
          regionName: 'New Jersey',
          city: 'Newark',
          query: '203.0.113.90',
        },
      });

    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers: {},
        ip: '127.0.0.1',
      } as any,
      publicIp: '203.0.113.90',
      laboratoryCode: 'ACCESS',
    });

    expect(result).toMatchObject({
      detectedStateCode: 'NJ',
      effectiveStateCode: 'NJ',
      countryCode: 'US',
      regionCode: 'NJ',
      regionName: 'New Jersey',
      city: 'Newark',
      source: 'ip_lookup',
    });
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      3,
      'http://ip-api.com/json/203.0.113.90?fields=status,countryCode,region,regionName,city,query',
      { timeout: 3000 },
    );
  });

  it('uses cached geo lookup results from Redis', async () => {
    mockedRedis.get.mockResolvedValue(
      JSON.stringify({
        ip: '203.0.113.88',
        countryCode: 'US',
        regionCode: 'NY',
        regionName: 'New York',
        city: 'New York',
        source: 'ipinfo',
      }),
    );

    const result = await stateRestrictionService.getLocationStatus({
      req: {
        headers: {},
        ip: '203.0.113.88',
      } as any,
    });

    expect(result).toMatchObject({
      detectedStateCode: 'NY',
      effectiveStateCode: 'NY',
      countryCode: 'US',
      regionCode: 'NY',
      regionName: 'New York',
      city: 'New York',
      source: 'ip_lookup',
    });
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });
});
