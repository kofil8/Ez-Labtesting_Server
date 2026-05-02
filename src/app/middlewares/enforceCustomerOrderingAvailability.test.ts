import { Role } from '@prisma/client';
import httpStatus from 'http-status';
import { enforceCustomerOrderingAvailability } from './enforceCustomerOrderingAvailability';
import stateRestrictionService from '../modules/stateRestriction/stateRestriction.service';

jest.mock('../modules/stateRestriction/stateRestriction.service', () => ({
  __esModule: true,
  default: {
    getLocationStatus: jest.fn(),
  },
}));

const mockedStateRestrictionService = jest.mocked(stateRestrictionService);

function buildRequest(role?: Role) {
  return {
    user: role ? { id: 'user-1', role } : undefined,
  } as any;
}

describe('enforceCustomerOrderingAvailability', () => {
  const response = {} as any;

  beforeEach(() => {
    mockedStateRestrictionService.getLocationStatus.mockReset();
  });

  it('skips non-customer users', async () => {
    const next = jest.fn();

    await enforceCustomerOrderingAvailability(buildRequest(Role.ADMIN), response, next);

    expect(mockedStateRestrictionService.getLocationStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('allows unrestricted customer IP locations', async () => {
    const next = jest.fn();
    mockedStateRestrictionService.getLocationStatus.mockResolvedValue({
      ip: '198.51.100.10',
      maskedIp: '198.xxx.xxx.10',
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

  it('blocks restricted customer IP locations with REGION_RESTRICTED details', async () => {
    const next = jest.fn();
    mockedStateRestrictionService.getLocationStatus.mockResolvedValue({
      ip: '198.51.100.20',
      maskedIp: '198.xxx.xxx.20',
      detectedStateCode: 'NY',
      effectiveStateCode: 'NY',
      laboratoryRoute: 'ACCESS',
      restrictionType: 'BLOCKED',
      canOrder: false,
      reason: 'Ordering is unavailable in your region.',
      source: 'ip_lookup',
    });

    await enforceCustomerOrderingAvailability(buildRequest(Role.CUSTOMER), response, next);

    const error = next.mock.calls[0][0];
    expect(error).toMatchObject({
      statusCode: httpStatus.FORBIDDEN,
      code: 'REGION_RESTRICTED',
      details: {
        stateCode: 'NY',
        detectedStateCode: 'NY',
        laboratoryRoute: 'ACCESS',
        restrictionType: 'BLOCKED',
        source: 'ip_lookup',
      },
    });
  });
});
