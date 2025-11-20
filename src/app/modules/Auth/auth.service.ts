import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import ApiError from '@/app/errors/ApiErrors';
import config from '@/config';
import { jwtHelpers } from '@/app/utils/jwtHelpers';

import { Secret, SignOptions } from 'jsonwebtoken';
import { prisma } from '@/config/db';
import redisClient from '@/config/redis';

const loginUserFromDB = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');

  const isCorrectPassword = await bcrypt.compare(payload.password, user.password);
  if (!isCorrectPassword) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid credentials');

  const accessToken = jwtHelpers.signToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as SignOptions['expiresIn'],
  );

  const refreshToken = jwtHelpers.signToken(
    { id: user.id },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as SignOptions['expiresIn'],
  );

  await redisClient.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  return { accessToken, refreshToken, user };
};

const refreshAccessToken = async (token: string) => {
  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(token, config.jwt.refresh_token_secret as Secret);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  const storedToken = await redisClient.get(`refresh:${decoded.id}`);
  if (!storedToken || storedToken !== token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');

  const newAccessToken = jwtHelpers.signToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as SignOptions['expiresIn'],
  );

  const newRefreshToken = jwtHelpers.signToken(
    { id: user.id },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as SignOptions['expiresIn'],
  );

  await redisClient.set(`refresh:${user.id}`, newRefreshToken, 'EX', 7 * 24 * 60 * 60);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logoutUser = async (userId: string, accessToken: string) => {
  await redisClient.del(`refresh:${userId}`);
  await redisClient.set(`blacklist:${accessToken}`, '1', 'EX', 60 * 60); // 1 hour blacklist
};

export const AuthServices = {
  loginUserFromDB,
  refreshAccessToken,
  logoutUser,
};
