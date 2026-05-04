import { Role } from '@prisma/client';
import { enforceCustomerOrderingAvailability } from './enforceCustomerOrderingAvailability';
import stateRestrictionService from '../modules/stateRestriction/stateRestriction.service';

jest.mock('../modules/stateRestriction/stateRestriction.service', () => ({
  __esModule: true,
  default: {
    getLocationStatus: jest.fn(),
    assertOrderingAllowed: jest.fn(),
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
    mockedStateRestrictionService.assertOrderingAllowed.mockReset();
    response.status.mockClear();
    response.json.mockClear();
  });

  it('skips unauthenticated requests', async () => {
    const next = jest.fn();

    await enforceCustomerOrderingAvailability(buildRequest(), response, next);

    expect(mockedStateRestrictionService.assertOrderingAllowed).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('allows unrestricted customer IP locations', async () => {
    const next = jest.fn();
    mockedStateRestrictionService.assertOrderingAllowed.mockResolvedValue({
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
    mockedStateRestrictionService.assertOrderingAllowed.mockRejectedValue(
      new Error('We are coming soon to your area. Ordering is currently unavailable in your state.'),
    );

    await enforceCustomerOrderingAvailability(buildRequest(Role.CUSTOMER), response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('logs allowed restriction decisions before continuing', async () => {
    const next = jest.fn();
    mockedStateRestrictionService.assertOrderingAllowed.mockResolvedValue({
      ip: '198.51.100.21',
      maskedIp: '198.xxx.xxx.21',
      countryCode: 'US',
      regionCode: 'MD',
      regionName: 'Maryland',
      city: 'Baltimore',
      detectedStateCode: 'MD',
      effectiveStateCode: 'MD',
      laboratoryRoute: 'ACCESS',
      restrictionType: null,
      canOrder: true,
      reason: null,
      source: 'ip_lookup',
    });

    await enforceCustomerOrderingAvailability(buildRequest(Role.CUSTOMER), response, next);

    expect(mockedStateRestrictionService.buildRestrictionDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveStateCode: 'MD',
      }),
    );
    expect(next).toHaveBeenCalledWith();
  });
});
