import ApiError from '@/app/errors/ApiErrors';
import { LoginAttemptService } from '@/app/helpers/loginAttempts.service';
import { emailTemplate } from '@/app/utils/emailtempForOTP';
import { jwtHelpers } from '@/app/utils/jwtHelpers';
import sentEmailUtility from '@/app/utils/sentEmailUtility';
import config from '@/config';
import { prisma } from '@/config/db';
import redisClient from '@/config/redis';
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret, SignOptions } from 'jsonwebtoken';
import { NotificationService } from '../notifications/notifications.service';

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  isVerified?: boolean;
};

/* -------------------------------------------------------
   REGISTER USER
------------------------------------------------------- */

const registerUserToDB = async (payload: RegisterPayload) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
  }

  const hashedPassword = await bcrypt.hash(payload.password, Number(config.salt));

  const newUser = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      phoneNumber: payload.phoneNumber,
      isVerified: false,
    },
  });

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Save in Redis
  await redisClient.set(`otp:${newUser.email}`, hashedOtp, 'EX', 5 * 60);

  // Send email
  await sentEmailUtility(
    newUser.email,
    'Please Verify your email',
    `Your OTP is: ${otp}`,
    emailTemplate(otp, 'Otp is valid for 5 minutes'),
  );

  return newUser;
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

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP before saving
  const hashedOtp = await bcrypt.hash(otp, 10);

  await redisClient.set(`otp:${email}`, hashedOtp, 'EX', 5 * 60);

  // Send email
  await sentEmailUtility(
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
  await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  // Remove OTP after success
  await redisClient.del(`otp:${email}`);

  return { message: 'Email verified successfully' };
};

/* -------------------------------------------------------
   LOGIN USER  + BRUTE-FORCE PROTECTION + TOKEN CREATION
------------------------------------------------------- */

const loginUserFromDB = async (
  payload: {
    email: string;
    password: string;
    pushToken?: string;
    platform?: string;
  },
  ip: string,
) => {
  const { email, pushToken, platform = 'web' } = payload;

  // 1️⃣ Check if account is locked
  const isLocked = await LoginAttemptService.isAccountLocked(email);
  if (isLocked) {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      'Too many failed attempts. Account is temporarily locked for 10 minutes.',
    );
  }

  // 2️⃣ Fetch user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      password: true,
      isVerified: true,
    },
  });

  // 3️⃣ Invalid email → failed attempt
  if (!user) {
    await LoginAttemptService.recordFailedAttempt(email, ip);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email or password');
  }

  // 4️⃣ Check email verification
  if (!user.isVerified) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please verify your email before logging in.');
  }

  // 5️⃣ Compare password
  const isCorrectPassword = await bcrypt.compare(payload.password, user.password);
  if (!isCorrectPassword) {
    await LoginAttemptService.recordFailedAttempt(email, ip);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email or password');
  }

  // 6️⃣ Successful login → reset attempts
  await LoginAttemptService.resetAttempts(email, ip);

  // Remove password
  const { password, ...userWithoutPassword } = user;

  // 7️⃣ Generate access token
  const accessToken = jwtHelpers.signToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as SignOptions['expiresIn'],
  );

  // 8️⃣ Generate refresh token
  const refreshToken = jwtHelpers.signToken(
    { id: user.id },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as SignOptions['expiresIn'],
  );

  // 9️⃣ Save refresh token in Redis
  await redisClient.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  // 🔥 10️⃣ Auto-register FCM push token (if provided)
  if (pushToken) {
    await NotificationService.registerToken(user.id, pushToken, platform);
  }

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
};

/* -------------------------------------------------------
   REFRESH ACCESS TOKEN (cookie-based refresh)
------------------------------------------------------- */

const refreshAccessToken = async (token: string) => {
  let decoded;

  try {
    decoded = jwtHelpers.verifyToken(token, config.jwt.refresh_token_secret as Secret);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }

  // Check if token matches Redis
  const storedToken = await redisClient.get(`refresh:${decoded.id}`);
  if (!storedToken || storedToken !== token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Session expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');

  // Issue new access token
  const newAccessToken = jwtHelpers.signToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as SignOptions['expiresIn'],
  );

  // Issue new refresh token (rotation)
  const newRefreshToken = jwtHelpers.signToken(
    { id: user.id },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as SignOptions['expiresIn'],
  );

  await redisClient.set(`refresh:${user.id}`, newRefreshToken, 'EX', 7 * 24 * 60 * 60);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/* -------------------------------------------------------
   LOGOUT USER (remove refresh token + blacklist access token)
------------------------------------------------------- */

const logoutUser = async (userId: string, accessToken: string, pushToken?: string) => {
  // 1️⃣ Remove refresh token
  await redisClient.del(`refresh:${userId}`);

  // 2️⃣ Blacklist access token for 1 hour
  await redisClient.set(`blacklist:${accessToken}`, '1', 'EX', 60 * 60);

  // 🔥 3️⃣ Auto-remove push token
  if (pushToken) {
    await NotificationService.unregisterToken(pushToken);
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

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP
  const hashedOtp = await bcrypt.hash(otp, 10);

  // Save in Redis (different key from registration to avoid conflict, or same if flow allows)
  // Using specific key for password reset to be safe
  await redisClient.set(`otp_reset:${email}`, hashedOtp, 'EX', 5 * 60);

  // Send email
  await sentEmailUtility(
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
