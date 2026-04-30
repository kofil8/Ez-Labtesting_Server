jest.mock('../../../config/redis', () => ({
  __esModule: true,
  default: {
    set: jest.fn(),
    ttl: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('../../utils/jwtHelpers', () => ({
  jwtHelpers: {
    signToken: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import redisClient from '../../../config/redis';
import { jwtHelpers } from '../../utils/jwtHelpers';
import { buildRefreshSessionKey, issueAuthSessionTokens } from './auth.session';

describe('auth.session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes a per-session refresh key with a positive TTL', async () => {
    (jwtHelpers.signToken as jest.Mock)
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');
    (redisClient.set as jest.Mock).mockResolvedValue('OK');
    (redisClient.ttl as jest.Mock).mockResolvedValue(86400);

    const result = await issueAuthSessionTokens({
      id: 'user-1',
      email: 'user@example.com',
      role: 'CUSTOMER',
    });

    expect(result.sid).toEqual(expect.any(String));
    expect(jwtHelpers.signToken).toHaveBeenNthCalledWith(
      1,
      { id: 'user-1', email: 'user@example.com', role: 'CUSTOMER' },
      expect.anything(),
      expect.anything(),
    );
    expect(jwtHelpers.signToken).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: 'user-1',
        sid: result.sid,
      }),
      expect.anything(),
      expect.anything(),
    );
    expect(redisClient.set).toHaveBeenCalledWith(
      buildRefreshSessionKey('user-1', result.sid),
      'refresh-token',
      'EX',
      expect.any(Number),
    );
    expect(redisClient.ttl).toHaveBeenCalledWith(buildRefreshSessionKey('user-1', result.sid));
    expect((redisClient.set as jest.Mock).mock.calls[0][3]).toBeGreaterThan(0);
  });
});
