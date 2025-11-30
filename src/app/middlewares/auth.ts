import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../errors/ApiErrors';
import { extractToken } from '../helpers/extractToken';
import { jwtHelpers } from '../utils/jwtHelpers';
import config from '../../config';
import { Secret } from 'jsonwebtoken';
import redisClient from '../../config/redis';
import { prisma } from '../../config/db';

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any; token?: string },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = extractToken(req.headers.authorization);

      if (!token) throw new ApiError(httpStatus.UNAUTHORIZED, 'Missing token');

      // Check blacklist
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Session expired');
      }

      const decoded = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as Secret);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');

      req.user = decoded;
      req.token = token;

      if (roles.length && !roles.includes(decoded.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
