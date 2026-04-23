jest.mock('./stateRestriction.service', () => ({
  __esModule: true,
  default: {
    getLocationStatus: jest.fn(),
  },
}));

import stateRestrictionController from './stateRestriction.controller';
import stateRestrictionService from './stateRestriction.service';

const createResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('StateRestrictionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the public location status payload', async () => {
    (stateRestrictionService.getLocationStatus as jest.Mock).mockResolvedValue({
      ip: '203.0.113.2',
      maskedIp: '203.xxx.xxx.2',
      detectedStateCode: 'CA',
      effectiveStateCode: 'CA',
      laboratoryRoute: 'ACCESS',
      restrictionType: null,
      canOrder: true,
      reason: null,
      source: 'geo_header',
    });

    const req: any = { query: {} };
    const res = createResponse();
    const next = jest.fn();

    await stateRestrictionController.getLocationStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        maskedIp: '203.xxx.xxx.2',
        laboratoryRoute: 'ACCESS',
      }),
    });
    expect(next).not.toHaveBeenCalled();
  });
});
