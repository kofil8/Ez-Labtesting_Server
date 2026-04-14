jest.mock('../../../config/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    ttl: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  },
}));

jest.mock('../../helpers/loginAttempts.service', () => ({
  LoginAttemptService: {
    isAccountLocked: jest.fn(),
    recordFailedAttempt: jest.fn(),
    resetAttempts: jest.fn(),
  },
}));

jest.mock('../../utils/sentEmailUtility', () => jest.fn());

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../notifications/notifications.service', () => ({
  NotificationService: {
    registerToken: jest.fn(),
    unregisterToken: jest.fn(),
  },
}));

jest.mock('./auth.session', () => ({
  buildLegacyRefreshSessionKey: jest.fn((userId: string) => `refresh:${userId}`),
  buildRefreshSessionKey: jest.fn((userId: string, sid: string) => `refresh:${userId}:${sid}`),
  deleteRefreshSessionByToken: jest.fn(),
  getTokenFingerprint: jest.fn(() => 'fingerprint-1'),
  issueAuthSessionTokens: jest.fn(),
  logAuthSessionEvent: jest.fn(),
  verifyRefreshTokenPayload: jest.fn(),
}));

import { prisma } from '../../../config/db';
import redisClient from '../../../config/redis';
import { AuthServices } from './auth.service';
import {
  buildLegacyRefreshSessionKey,
  buildRefreshSessionKey,
  deleteRefreshSessionByToken,
  issueAuthSessionTokens,
  verifyRefreshTokenPayload,
} from './auth.session';

describe('AuthServices refresh sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refreshes a sid-based session and preserves the same sid', async () => {
    (verifyRefreshTokenPayload as jest.Mock).mockReturnValue({ id: 'user-1', sid: 'sid-1' });
    (redisClient.get as jest.Mock).mockResolvedValue('presented-token');
    (redisClient.ttl as jest.Mock).mockResolvedValue(100);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'CUSTOMER',
    });
    (issueAuthSessionTokens as jest.Mock).mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      sid: 'sid-1',
      refreshKey: 'refresh:user-1:sid-1',
    });

    const result = await AuthServices.refreshAccessToken('presented-token');

    expect(redisClient.get).toHaveBeenCalledWith('refresh:user-1:sid-1');
    expect(buildRefreshSessionKey).toHaveBeenCalledWith('user-1', 'sid-1');
    expect(issueAuthSessionTokens).toHaveBeenCalledWith(
      { id: 'user-1', email: 'user@example.com', role: 'CUSTOMER' },
      { sid: 'sid-1', event: 'refresh-rotate' },
    );
    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });

  it('throws when the refresh session is missing from Redis', async () => {
    (verifyRefreshTokenPayload as jest.Mock).mockReturnValue({ id: 'user-1', sid: 'sid-1' });
    (redisClient.get as jest.Mock).mockResolvedValue(null);
    (redisClient.ttl as jest.Mock).mockResolvedValue(-2);

    await expect(AuthServices.refreshAccessToken('presented-token')).rejects.toMatchObject({
      message: 'No active session found',
    });
  });

  it('throws when the stored refresh token does not match the presented token', async () => {
    (verifyRefreshTokenPayload as jest.Mock).mockReturnValue({ id: 'user-1', sid: 'sid-1' });
    (redisClient.get as jest.Mock).mockResolvedValue('different-token');
    (redisClient.ttl as jest.Mock).mockResolvedValue(100);

    await expect(AuthServices.refreshAccessToken('presented-token')).rejects.toMatchObject({
      message: 'Refresh token mismatch',
    });
  });

  it('migrates a legacy refresh key to the sid-based session model', async () => {
    (verifyRefreshTokenPayload as jest.Mock).mockReturnValue({ id: 'user-1' });
    (redisClient.get as jest.Mock).mockResolvedValue('legacy-token');
    (redisClient.ttl as jest.Mock).mockResolvedValue(100);
    (redisClient.del as jest.Mock).mockResolvedValue(1);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'CUSTOMER',
    });
    (issueAuthSessionTokens as jest.Mock).mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      sid: 'sid-2',
      refreshKey: 'refresh:user-1:sid-2',
    });

    const result = await AuthServices.refreshAccessToken('legacy-token');

    expect(buildLegacyRefreshSessionKey).toHaveBeenCalledWith('user-1');
    expect(issueAuthSessionTokens).toHaveBeenCalledWith(
      { id: 'user-1', email: 'user@example.com', role: 'CUSTOMER' },
      { event: 'refresh-migrate-legacy' },
    );
    expect(redisClient.del).toHaveBeenCalledWith('refresh:user-1');
    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });

  it('logout invalidates only the current refresh session and blacklists the access token', async () => {
    (deleteRefreshSessionByToken as jest.Mock).mockResolvedValue(true);
    (redisClient.set as jest.Mock).mockResolvedValue('OK');

    await AuthServices.logoutUser('user-1', 'access-token', 'refresh-token');

    expect(deleteRefreshSessionByToken).toHaveBeenCalledWith('user-1', 'refresh-token');
    expect(redisClient.set).toHaveBeenCalledWith(
      'blacklist:access-token',
      '1',
      'EX',
      expect.any(Number),
    );
    expect(redisClient.del).not.toHaveBeenCalledWith('refresh:user-1');
  });
});
