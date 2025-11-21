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
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  /* -----------------------------------------
       🔥 Generate OTP and store in Redis
  ----------------------------------------- */

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP in Redis for 5 minutes
  const hashedOtp = await bcrypt.hash(otp.toString(), 10);

  await redisClient.set(`otp:${newUser.email}`, hashedOtp, 'EX', 5 * 60);

  /* -----------------------------------------
       🔥 Send OTP email
  ----------------------------------------- */

  const subject = 'Verify your email address';
  const text = `Your verification code is: ${otp}`;
  const html = emailTemplate(otp, 'Welcome to Ez Lab Testing! Verify your email within 5 minutes.');

  await sentEmailUtility(newUser.email, subject, text, html);

  return newUser;
};

// Resend OTP
const resendOTP = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (user.isVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already verified');
  }

  /* --------------------------------------------------
     🚫 Anti-spam Protection
  ---------------------------------------------------*/

  const cooldownKey = `otp_resend_cooldown:${email}`;
  const hourlyKey = `otp_hourly_limit:${email}`;

  // Per-minute cooldown
  const cooldown = await redisClient.get(cooldownKey);
  if (cooldown) {
    throw new ApiError(429, 'Please wait 60 seconds before requesting another OTP.');
  }

  // Hourly limit (max 5 OTP sends per hour)
  const hourlyCount = await redisClient.incr(hourlyKey);
  if (hourlyCount === 1) {
    await redisClient.expire(hourlyKey, 60 * 60); // 1 hour
  }
  if (hourlyCount > 5) {
    throw new ApiError(429, 'Too many OTP requests. Try again later.');
  }

  // Set 1-minute cooldown
  await redisClient.set(cooldownKey, '1', 'EX', 60);

  /* --------------------------------------------------
     🔥 Generate new OTP and store it
  ---------------------------------------------------*/

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await redisClient.set(`otp:${email}`, otp, 'EX', 5 * 60);

  /* --------------------------------------------------
     📧 Send OTP Email
  ---------------------------------------------------*/

  const subject = 'Your new verification code';
  const text = `Your new verification code is: ${otp}`;
  const html = emailTemplate(Number(otp), 'Here is your new OTP. It is valid for 5 minutes.');

  await sentEmailUtility(email, subject, text, html);

  return { message: 'OTP resent successfully' };
};

// Verify Registration OTP
const verifyRegistrationOTP = async (email: string, otp: string) => {
  const savedOtp = await bcrypt.compare(otp, await redisClient.get(`otp:${email}`));

  if (!savedOtp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP expired or invalid');
  }

  if (savedOtp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  if (savedOtp !== otp.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  // Mark user as verified
  await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  // Remove OTP from Redis (one-time use)
  await redisClient.del(`otp:${email}`);

  return { message: 'Email verified successfully' };
};

/* -------------------------------------------------------
   LOGIN USER  + BRUTE-FORCE PROTECTION + TOKEN CREATION
------------------------------------------------------- */

const loginUserFromDB = async (payload: { email: string; password: string }, ip: string) => {
  const email = payload.email;

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

  // 3️⃣ Invalid email (failed attempt)
  if (!user) {
    await LoginAttemptService.recordFailedAttempt(email, ip);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email or password');
  }

  // isVerified check
  if (!user.isVerified) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please verify your email before logging in.');
  }

  // 4️⃣ Compare password
  const isCorrectPassword = await bcrypt.compare(payload.password, user.password);
  if (!isCorrectPassword) {
    await LoginAttemptService.recordFailedAttempt(email, ip);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email or password');
  }

  // 5️⃣ Successful login → reset attempts
  await LoginAttemptService.resetAttempts(email, ip);

  // Remove password
  const { password, ...userWithoutPassword } = user;

  // 6️⃣ Generate access token
  const accessToken = jwtHelpers.signToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as SignOptions['expiresIn'],
  );

  // 7️⃣ Generate refresh token
  const refreshToken = jwtHelpers.signToken(
    { id: user.id },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as SignOptions['expiresIn'],
  );

  // 8️⃣ Save refresh token in Redis (rotation)
  await redisClient.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

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

const logoutUser = async (userId: string, accessToken: string) => {
  // Remove refresh token
  await redisClient.del(`refresh:${userId}`);

  // Blacklist access token for 1 hour
  await redisClient.set(`blacklist:${accessToken}`, '1', 'EX', 60 * 60);
};

export const AuthServices = {
  registerUserToDB,
  verifyRegistrationOTP,
  loginUserFromDB,
  refreshAccessToken,
  logoutUser,
};
