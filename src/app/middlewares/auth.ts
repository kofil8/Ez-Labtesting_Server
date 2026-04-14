import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import { prisma } from '../../config/db';
import redisClient from '../../config/redis';
import ApiError from '../errors/ApiErrors';
import { extractToken } from '../helpers/extractToken';
import { jwtHelpers } from '../utils/jwtHelpers';

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any; token?: string },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Prefer Authorization header, else fall back to cookie-based access token
      let token = extractToken(req.headers.authorization);

      if (!token) {
        const cookieToken = (req as any)?.cookies?.accessToken;
        if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
          token = cookieToken;
        }
      }

      if (!token) {
        console.error('[AUTH] Missing token - No Authorization header or cookie found');
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Missing token');
      }

      // Check blacklist
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Session expired');
      }

      const decoded = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as Secret);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          mfaEnabled: true,
        },
      });

      if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found for token');

      req.user = decoded;
      req.token = token;

      if (roles.length && !roles.includes(decoded.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
      }

      // Check if MFA is required but not enabled for privileged roles
      // EXCEPT for MFA setup/management endpoints and profile access
      const privilegedRoles = ['ADMIN', 'LAB_PARTNER'];
      const roleKey = (user.role || '').toUpperCase();
      const fullPath = (req.baseUrl || '') + (req.path || '');
      const originalUrl = req.originalUrl || '';
      const requestMethod = req.method || '';

      // Allow access to:
      // 1. MFA setup/management endpoints
      // 2. Profile endpoints (needed to navigate to security settings)
      // 3. GET requests to read-only endpoints
      const isMFAEndpoint = fullPath.includes('/auth/mfa') || originalUrl.includes('/auth/mfa');
      const isProfileEndpoint = fullPath.includes('/profile') || originalUrl.includes('/profile');
      const isReadOnlyRequest = requestMethod === 'GET';

      if (
        privilegedRoles.includes(roleKey) &&
        !user.mfaEnabled &&
        !isMFAEndpoint &&
        !isProfileEndpoint &&
        !isReadOnlyRequest
      ) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'Two-factor authentication is required for your account. Please set up MFA to continue.',
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
