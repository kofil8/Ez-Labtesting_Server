import { Role } from '@prisma/client';
import { enforceCustomerOrderingAvailability } from './enforceCustomerOrderingAvailability';
import stateRestrictionService from '../modules/stateRestriction/stateRestriction.service';

jest.mock('../modules/stateRestriction/stateRestriction.service', () => ({
  __esModule: true,
  default: {
    getLocationStatus: jest.fn(),
    buildRestrictionDecision: jest.fn((status) => ({
      restricted: status.canOrder === false,
      reason: status.reason || undefined,
      stateCode: status.effectiveStateCode || status.detectedStateCode || undefined,
      stateName:
        status.effectiveStateCode === 'NY'
          ? 'New York'
          : status.effectiveStateCode === 'MD'
            ? 'Maryland'
            : undefined,
      message: status.canOrder === false
        ? 'We are coming soon to your area. Ordering is currently unavailable in your state.'
        : 'Available for online ordering.',
    })),
  },
}));

const mockedStateRestrictionService = jest.mocked(stateRestrictionService);

function buildRequest(role?: Role) {
  return {
    user: role ? { id: 'user-1', role } : undefined,
    originalUrl: '/api/v1/cart/sync',
    path: '/cart/sync',
  } as any;
}

describe('enforceCustomerOrderingAvailability', () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any;

  beforeEach(() => {
    mockedStateRestrictionService.getLocationStatus.mockReset();
    response.status.mockClear();
    response.json.mockClear();
  });

  it('skips unauthenticated requests', async () => {
    const next = jest.fn();

    await enforceCustomerOrderingAvailability(buildRequest(), response, next);

    expect(mockedStateRestrictionService.getLocationStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('allows unrestricted customer IP locations', async () => {
    const next = jest.fn();
    mockedStateRestrictionService.getLocationStatus.mockResolvedValue({
      ip: '198.51.100.10',
      maskedIp: '198.xxx.xxx.10',
      countryCode: 'US',
      regionCode: 'CA',
      regionName: 'California',
      city: 'Los Angeles',
      detectedStateCode: 'CA',
      effectiveStateCode: 'CA',
      laboratoryRoute: 'ACCESS',
      restrictionType: null,
      canOrder: true,
      reason: null,
      source: 'ip_lookup',
    });

    await enforceCustomerOrderingAvailability(buildRequest(Role.CUSTOMER), response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('blocks restricted customer IP locations with RESTRICTED_STATE response', async () => {
    const next = jest.fn();
    mockedStateRestrictionService.getLocationStatus.mockResolvedValue({
      ip: '198.51.100.20',
      maskedIp: '198.xxx.xxx.20',
      countryCode: 'US',
      regionCode: 'NY',
      regionName: 'New York',
      city: 'New York',
      detectedStateCode: 'NY',
      effectiveStateCode: 'NY',
      laboratoryRoute: 'ACCESS',
      restrictionType: 'BLOCKED',
      canOrder: false,
      reason: 'Ordering is unavailable in your region.',
      source: 'ip_lookup',
    });

    await enforceCustomerOrderingAvailability(buildRequest(Role.CUSTOMER), response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      code: 'RESTRICTED_STATE',
      message: 'We are coming soon to your area. Ordering is currently unavailable in your state.',
      stateCode: 'NY',
      stateName: 'New York',
    });
  });

  it('reports state names from the restriction decision', async () => {
    const next = jest.fn();
    mockedStateRestrictionService.getLocationStatus.mockResolvedValue({
      ip: '198.51.100.21',
      maskedIp: '198.xxx.xxx.21',
      countryCode: 'US',
      regionCode: 'MD',
      regionName: 'Maryland',
      city: 'Baltimore',
      detectedStateCode: 'MD',
      effectiveStateCode: 'MD',
      laboratoryRoute: 'ACCESS',
      restrictionType: 'REQUIRES_PHYSICIAN',
      canOrder: false,
      reason: 'Orders from your region require physician review and are not available online.',
      source: 'ip_lookup',
    });

    await enforceCustomerOrderingAvailability(buildRequest(Role.CUSTOMER), response, next);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stateCode: 'MD',
        stateName: 'Maryland',
      }),
    );
  });
});
