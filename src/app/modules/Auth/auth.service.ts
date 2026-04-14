import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import { prisma } from '../../../config/db';
import redisClient from '../../../config/redis';
import ApiError from '../../errors/ApiErrors';
import { LoginAttemptService } from '../../helpers/loginAttempts.service';
import { emailTemplate } from '../../utils/emailtempForOTP';
import { jwtHelpers } from '../../utils/jwtHelpers';
import sentEmailUtility from '../../utils/sentEmailUtility';
import { welcomeEmailTemplate } from '../../utils/welcomeEmailTemplate';
import { NotificationService } from '../notifications/notifications.service';
import logger from '../../utils/logger';
import { parseExpiryToSeconds } from '../../utils/tokenExpiry';
import {
  buildLegacyRefreshSessionKey,
  buildRefreshSessionKey,
  deleteRefreshSessionByToken,
  getTokenFingerprint,
  issueAuthSessionTokens,
  logAuthSessionEvent,
  verifyRefreshTokenPayload,
} from './auth.session';

type LoginPayload = {
  email?: string;
  phoneNumber?: string;
  password: string;
  pushToken?: string;
  platform?: string;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username?: string;
  gender: any;
  password: string;
  isVerified?: boolean;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

const ACCESS_TOKEN_BLACKLIST_TTL = parseExpiryToSeconds(config.jwt.expires_in as string);

const queueOtpEmail = (email: string, subject: string, text: string, html: string) => {
  void sentEmailUtility(email, subject, text, html).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to send OTP email:', error);
  });
};

/* -------------------------------------------------------
   REGISTER USER
------------------------------------------------------- */

const registerUserToDB = async (payload: RegisterPayload) => {
  // Validate phone number is provided
  if (!payload.phoneNumber || payload.phoneNumber.trim() === '') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number is required for registration');
  }

  // Check for existing email or phone number
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email }, { phoneNumber: payload.phoneNumber }],
    },
  });

  if (existingUser) {
    if (existingUser.email === payload.email) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
    }
    if (existingUser.phoneNumber === payload.phoneNumber) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number already registered');
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const [hashedPassword, hashedOtp] = await Promise.all([
    bcrypt.hash(payload.password, Number(config.salt)),
    bcrypt.hash(otp, 8),
  ]);

  const newUser = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      phoneNumber: payload.phoneNumber,
      isVerified: false,
      username: payload.username,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2,
      city: payload.city,
      state: payload.state,
      zipCode: payload.zipCode,
    },
  });

  // Save in Redis
  await redisClient.set(`otp:${newUser.email}`, hashedOtp, 'EX', 5 * 60);

  // Send email without blocking the response path
  queueOtpEmail(
    newUser.email,
    'Please Verify your email',
    `Your OTP is: ${otp}`,
    emailTemplate(otp, 'Otp is valid for 5 minutes'),
  );

  return {
    id: newUser.id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
    phoneNumber: newUser.phoneNumber,
    createdAt: newUser.createdAt,
  };
};

// Resend OTP
const resendOTP = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new ApiError(400, 'User not found');
  if (user.isVerified) throw new ApiError(400, 'User already verified');

  // Anti-spam
  const cooldownKey = `otp_resend_cooldown:${email}`;
  const hourlyKey = `otp_hourly_limit:${email}`;

  if (await redisClient.get(cooldownKey)) {
    throw new ApiError(429, 'Please wait 60 seconds before requesting another OTP.');
  }

  const hourlyCount = await redisClient.incr(hourlyKey);
  if (hourlyCount === 1) {
    await redisClient.expire(hourlyKey, 60 * 60);
  }
  if (hourlyCount > 5) {
    throw new ApiError(429, 'Too many OTP requests. Try again later.');
  }

  await redisClient.set(cooldownKey, '1', 'EX', 60);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const hashedOtp = await bcrypt.hash(otp, 8);

  await redisClient.set(`otp:${email}`, hashedOtp, 'EX', 5 * 60);

  queueOtpEmail(
    email,
    'Your new OTP',
    `Your new verification code is: ${otp}`,
    emailTemplate(otp, 'Here is your new OTP'),
  );

  return { message: 'OTP resent successfully' };
};

// Verify Registration OTP
const verifyRegistrationOTP = async (email: string, otp: string) => {
  const hashedOtp = await redisClient.get(`otp:${email}`);

  if (!hashedOtp) {
    throw new ApiError(400, 'OTP expired or invalid');
  }

  const isValid = await bcrypt.compare(otp, hashedOtp);

  if (!isValid) {
    throw new ApiError(400, 'Invalid OTP');
  }

  // Mark user verified
  const verifiedUser = await prisma.user.update({
    where: { email },
    data: { isVerified: true },
    select: {
      email: true,
      firstName: true,
    },
  });

  // Send a welcome email without blocking the response path
  queueOtpEmail(
    verifiedUser.email,
    'Email verified successfully - Welcome!',
    'Your email has been verified successfully. Welcome to our platform!',
    welcomeEmailTemplate(verifiedUser.firstName ?? undefined),
  );

  // Remove OTP after success
  await redisClient.del(`otp:${email}`);

  return { message: 'Email verified successfully' };
};

/* -------------------------------------------------------
   LOGIN USER  + BRUTE-FORCE PROTECTION + TOKEN CREATION
------------------------------------------------------- */

const loginUserFromDB = async (payload: LoginPayload, ip: string) => {
  const { password, pushToken, platform = 'web' } = payload;

  if (!payload.email && !payload.phoneNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email or phone number is required to login');
  }

  const loginIdentifier = payload.email || payload.phoneNumber!;

  const isLocked = await LoginAttemptService.isAccountLocked(loginIdentifier);
  if (isLocked) {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      'Too many failed attempts. Account is temporarily locked for 10 minutes.',
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(payload.email ? [{ email: payload.email }] : []),
        ...(payload.phoneNumber ? [{ phoneNumber: payload.phoneNumber }] : []),
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      phoneNumber: true,
      password: true,
      isVerified: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true,
    },
  });

  if (!user) {
    await LoginAttemptService.recordFailedAttempt(loginIdentifier, ip);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email/phone or password');
  }

  if (!user.isVerified) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please verify your email before logging in.');
  }

  const isCorrectPassword = await bcrypt.compare(password, user.password);
  if (!isCorrectPassword) {
    await LoginAttemptService.recordFailedAttempt(loginIdentifier, ip);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email/phone or password');
  }

  await LoginAttemptService.resetAttempts(loginIdentifier, ip);

  const isFirstLogin = !user.lastLogin;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const userWithMFA = await prisma.user.findUnique({
    where: { id: user.id },
    select: { mfaEnabled: true },
  });

  if (userWithMFA?.mfaEnabled) {
    const tempToken = jwtHelpers.signToken(
      { id: user.id, email: user.email, type: 'mfa_temp' },
      config.jwt.jwt_secret as Secret,
      '5m',
    );

    return {
      mfaRequired: true,
      tempToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      isFirstLogin,
    };
  }

  const { accessToken, refreshToken } = await issueAuthSessionTokens(
    { id: user.id, email: user.email, role: user.role },
    { event: 'login-issue' },
  );

  if (pushToken) {
    try {
      await NotificationService.registerToken(user.id, pushToken, platform);
    } catch (error) {
      logger.error('Failed to register push token during login', error);
    }
  }

  return {
    mfaRequired: false,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      lastLogin: user.lastLogin,
    },
    isFirstLogin,
  };
};

/* -------------------------------------------------------
   REFRESH ACCESS TOKEN (cookie-based refresh)
------------------------------------------------------- */

const refreshAccessToken = async (token: string) => {
  let decoded: { id: string; sid?: string };

  try {
    decoded = verifyRefreshTokenPayload(token);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  const tokenFingerprint = getTokenFingerprint(token);
  let storedToken: string | null = null;
  let sessionSid = decoded.sid;

  if (sessionSid) {
    const refreshKey = buildRefreshSessionKey(decoded.id, sessionSid);
    storedToken = await redisClient.get(refreshKey);
    const ttl = await redisClient.ttl(refreshKey);

    logAuthSessionEvent('refresh-read', {
      userId: decoded.id,
      sid: sessionSid,
      key: refreshKey,
      hit: Boolean(storedToken),
      ttl,
      tokenFingerprint,
    });
  } else {
    const legacyKey = buildLegacyRefreshSessionKey(decoded.id);
    storedToken = await redisClient.get(legacyKey);
    const ttl = await redisClient.ttl(legacyKey);

    logAuthSessionEvent('refresh-read-legacy', {
      userId: decoded.id,
      sid: null,
      key: legacyKey,
      hit: Boolean(storedToken),
      ttl,
      tokenFingerprint,
    });
  }

  if (!storedToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'No active session found');
  }

  if (storedToken !== token) {
    logAuthSessionEvent('refresh-mismatch', {
      userId: decoded.id,
      sid: sessionSid ?? null,
      tokenFingerprint,
    });
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Refresh token mismatch');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  if (!sessionSid) {
    const legacyKey = buildLegacyRefreshSessionKey(decoded.id);
    const rotatedSession = await issueAuthSessionTokens(
      { id: user.id, email: user.email, role: user.role },
      { event: 'refresh-migrate-legacy' },
    );

    await redisClient.del(legacyKey);

    logAuthSessionEvent('refresh-legacy-migrated', {
      userId: decoded.id,
      previousKey: legacyKey,
      newKey: rotatedSession.refreshKey,
      sid: rotatedSession.sid,
      tokenFingerprint,
    });

    return {
      accessToken: rotatedSession.accessToken,
      refreshToken: rotatedSession.refreshToken,
    };
  }

  const rotatedSession = await issueAuthSessionTokens(
    { id: user.id, email: user.email, role: user.role },
    { sid: sessionSid, event: 'refresh-rotate' },
  );

  return {
    accessToken: rotatedSession.accessToken,
    refreshToken: rotatedSession.refreshToken,
  };
};

/* -------------------------------------------------------
   LOGOUT USER (remove refresh token + blacklist access token)
------------------------------------------------------- */

const logoutUser = async (
  userId: string,
  accessToken: string,
  refreshToken?: string | null,
  pushToken?: string,
) => {
  await deleteRefreshSessionByToken(userId, refreshToken);
  await redisClient.set(`blacklist:${accessToken}`, '1', 'EX', ACCESS_TOKEN_BLACKLIST_TTL);

  if (pushToken) {
    try {
      await NotificationService.unregisterToken(userId, pushToken);
    } catch (error) {
      logger.error('Failed to remove push token during logout', error);
    }
  }
};

// Forgot Password
const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  // Anti-spam (reuse logic if possible, or simple check)
  const cooldownKey = `otp_forgot_cooldown:${email}`;
  if (await redisClient.get(cooldownKey)) {
    throw new ApiError(429, 'Please wait 60 seconds before requesting another OTP.');
  }

  await redisClient.set(cooldownKey, '1', 'EX', 60);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const hashedOtp = await bcrypt.hash(otp, 10);

  // Save in Redis (different key from registration to avoid conflict, or same if flow allows)
  // Using specific key for password reset to be safe
  await redisClient.set(`otp_reset:${email}`, hashedOtp, 'EX', 5 * 60);

  queueOtpEmail(
    email,
    'Reset your password',
    `Your password reset code is: ${otp}`,
    emailTemplate(otp, 'Reset your password'),
  );

  return { message: 'OTP sent to your email' };
};

// Reset Password
const resetPassword = async (payload: { email: string; otp: string; newPassword: string }) => {
  const { email, otp, newPassword } = payload;

  const hashedOtp = await redisClient.get(`otp_reset:${email}`);

  if (!hashedOtp) {
    throw new ApiError(400, 'OTP expired or invalid');
  }

  const isValid = await bcrypt.compare(otp, hashedOtp);

  if (!isValid) {
    throw new ApiError(400, 'Invalid OTP');
  }

  const hashedPassword = await bcrypt.hash(newPassword, Number(config.salt));

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  await redisClient.del(`otp_reset:${email}`);

  return { message: 'Password reset successfully' };
};

export const AuthServices = {
  registerUserToDB,
  resendOTP,
  verifyRegistrationOTP,
  loginUserFromDB,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
};
