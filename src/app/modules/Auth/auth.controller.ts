import ApiError from '@/app/errors/ApiErrors';
import catchAsync from '@/app/helpers/catchAsync';
import sendResponse from '@/app/helpers/sendResponse';
import httpStatus from 'http-status';
import { AuthServices } from './auth.service';

// ---------------------------
// REGISTER USER
// ---------------------------
const registerUser = catchAsync(async (req, res) => {
  const result = await AuthServices.registerUserToDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'User registered successfully. Please verify your email to activate your account.',
    data: result,
  });
});

// Resend OTP
const resendOTP = catchAsync(async (req, res) => {
  const { email } = req.body;

  const result = await AuthServices.resendOTP(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP resent successfully',
    data: result,
  });
});

// Verify Email with OTP
const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const result = await AuthServices.verifyRegistrationOTP(email, otp);

  sendResponse(res, {
    statusCode: 200,
    message: 'OTP verified successfully',
    data: result,
  });
});

// ---------------------------
// LOGIN USER (Set refresh token cookie)
// ---------------------------
const loginUser = catchAsync(async (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip;

  const { accessToken, refreshToken, user } = await AuthServices.loginUserFromDB(req.body, ip);

  // Store refresh token in secure HttpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logged in successfully',
    data: {
      accessToken, // returned normally
      user,
    },
  });
});

// ---------------------------
// REFRESH ACCESS TOKEN (Read cookie)
// ---------------------------
const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Refresh token missing');
  }

  const result = await AuthServices.refreshAccessToken(token);

  // Issue a new refresh token cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Token refreshed successfully',
    data: {
      accessToken: result.accessToken,
    },
  });
});

// ---------------------------
// LOGOUT USER (Clear cookie)
// ---------------------------
const logoutUser = catchAsync(async (req, res) => {
  const accessToken = req.token;
  const userId = req.user?.id;

  if (!accessToken || !userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized request');
  }

  // Remove refresh token from Redis & blacklist access token
  await AuthServices.logoutUser(userId, accessToken);

  // Clear the refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logged out successfully',
    data: null,
  });
});

export const AuthControllers = {
  registerUser,
  resendOTP,
  verifyOTP,
  loginUser,
  refreshToken,
  logoutUser,
};
