import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret, SignOptions } from 'jsonwebtoken';
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

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
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

const loginUserFromDB = async (
  payload: {
    email?: string;
    phoneNumber?: string;
    password: string;
    pushToken?: string;
    platform?: string;
  },
  ip: string,
) => {
  const { password, pushToken, platform = 'web' } = payload;

  // Validate that either email or phone number is provided
  if (!payload.email && !payload.phoneNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email or phone number is required to login');
  }

  // Determine the identifier for login attempts tracking
  const loginIdentifier = payload.email || payload.phoneNumber!;

  // 1️⃣ Check if account is locked
  const isLocked = await LoginAttemptService.isAccountLocked(loginIdentifier);
  if (isLocked) {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      'Too many failed attempts. Account is temporarily locked for 10 minutes.',
    );
  }

  // 2️⃣ Fetch user by email OR phone number
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
      email: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true,
      password: true,
      isVerified: true,
    },
  });

  // 3️⃣ Invalid credentials → failed attempt
  if (!user) {
    await LoginAttemptService.recordFailedAttempt(loginIdentifier, ip);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email/phone or password');
  }

  // 4️⃣ Check email verification
  if (!user.isVerified) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please verify your email before logging in.');
  }

  // 5️⃣ Compare password
  const isCorrectPassword = await bcrypt.compare(password, user.password);
  if (!isCorrectPassword) {
    await LoginAttemptService.recordFailedAttempt(loginIdentifier, ip);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email/phone or password');
  }

  // 6️⃣ Successful login → reset attempts
  await LoginAttemptService.resetAttempts(loginIdentifier, ip);

  const isFirstLogin = !user.lastLogin;

  // 6️⃣.5 Update lastLogin timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Remove password
  const { password: _, ...userWithoutPassword } = user;

  // Check if MFA is enabled for this user
  const userWithMFA = await prisma.user.findUnique({
    where: { id: user.id },
    select: { mfaEnabled: true },
  });

  if (userWithMFA?.mfaEnabled) {
    // Generate temporary token for MFA verification (5 min expiry)
    const tempToken = jwtHelpers.signToken(
      { id: user.id, email: user.email, type: 'mfa_temp' },
      config.jwt.jwt_secret as Secret,
      '5m',
    );

    return {
      mfaRequired: true,
      tempToken,
      user: userWithoutPassword,
      isFirstLogin,
    };
  }

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
    isFirstLogin,
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
