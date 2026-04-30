import { createHash, randomUUID } from 'crypto';
import { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import config from '../../../config';
import { env } from '../../../config/env';
import redisClient from '../../../config/redis';
import { REFRESH_TOKEN_REDIS_TTL } from '../../../config/cookies';
import logger from '../../utils/logger';
import { jwtHelpers } from '../../utils/jwtHelpers';

export type AuthSessionUser = {
  id: string;
  email: string;
  role: string;
};

export type RefreshSessionPayload = {
  id: string;
  sid?: string;
};

const AUTH_SESSION_DEBUG = env.AUTH_SESSION_DEBUG;

export const buildLegacyRefreshSessionKey = (userId: string) => `refresh:${userId}`;

export const buildRefreshSessionKey = (userId: string, sid: string) => `refresh:${userId}:${sid}`;

export const getTokenFingerprint = (token: string) =>
  createHash('sha256').update(token).digest('hex').slice(0, 12);

export const describeRedisTarget = (redisUrl: string) => {
  try {
    const parsedUrl = new URL(redisUrl);
    const dbSegment = parsedUrl.pathname.replace(/^\//, '');
    const parsedDb = dbSegment ? Number.parseInt(dbSegment, 10) : 0;
    const db = Number.isFinite(parsedDb) ? parsedDb : 0;
    const port = parsedUrl.port || '6379';

    return `host=${parsedUrl.hostname} port=${port} db=${db}`;
  } catch {
    return 'invalid REDIS_URL';
  }
};

export const logAuthSessionEvent = (event: string, data: Record<string, unknown>) => {
  if (!AUTH_SESSION_DEBUG) {
    return;
  }

  logger.info(
    JSON.stringify({
      scope: 'auth-session',
      event,
      ...data,
    }),
  );
};

export const verifyRefreshTokenPayload = (token: string): RefreshSessionPayload => {
  const decoded = jwtHelpers.verifyToken(token, config.jwt.refresh_token_secret as Secret) as JwtPayload;
  const userId = typeof decoded.id === 'string' ? decoded.id : null;
  const sid = typeof decoded.sid === 'string' ? decoded.sid : undefined;

  if (!userId) {
    throw new Error('Refresh token payload is missing user id');
  }

  return { id: userId, sid };
};

export const issueAuthSessionTokens = async (
  user: AuthSessionUser,
  options?: {
    sid?: string;
    event?: string;
  },
) => {
  const sid = options?.sid ?? randomUUID();

  const accessToken = jwtHelpers.signToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as SignOptions['expiresIn'],
  );

  const refreshToken = jwtHelpers.signToken(
    { id: user.id, sid },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as SignOptions['expiresIn'],
  );

  const refreshKey = buildRefreshSessionKey(user.id, sid);
  const setResult = await redisClient.set(refreshKey, refreshToken, 'EX', REFRESH_TOKEN_REDIS_TTL);
  const ttl = await redisClient.ttl(refreshKey);

  logAuthSessionEvent(options?.event ?? 'issue', {
    userId: user.id,
    sid,
    key: refreshKey,
    setResult,
    ttl,
    tokenFingerprint: getTokenFingerprint(refreshToken),
  });

  return {
    accessToken,
    refreshToken,
    sid,
    refreshKey,
  };
};

export const deleteRefreshSessionByToken = async (userId: string, refreshToken?: string | null) => {
  if (!refreshToken) {
    logAuthSessionEvent('logout-no-refresh-cookie', { userId });
    return false;
  }

  try {
    const payload = verifyRefreshTokenPayload(refreshToken);

    if (payload.id !== userId || !payload.sid) {
      logAuthSessionEvent('logout-invalid-refresh-session', {
        userId,
        tokenUserId: payload.id,
        sid: payload.sid ?? null,
      });
      return false;
    }

    const refreshKey = buildRefreshSessionKey(payload.id, payload.sid);
    const deletedCount = await redisClient.del(refreshKey);

    logAuthSessionEvent('logout-session-delete', {
      userId,
      sid: payload.sid,
      key: refreshKey,
      deletedCount,
      tokenFingerprint: getTokenFingerprint(refreshToken),
    });

    return deletedCount > 0;
  } catch {
    logAuthSessionEvent('logout-refresh-token-invalid', {
      userId,
      tokenFingerprint: getTokenFingerprint(refreshToken),
    });
    return false;
  }
};
