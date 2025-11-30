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

// ---------------------------
// RESEND OTP
// ---------------------------
const resendOTP = catchAsync(async (req, res) => {
  const { email } = req.body;

  const result = await AuthServices.resendOTP(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP resent successfully',
    data: result,
  });
});

// ---------------------------
// VERIFY REGISTRATION OTP
// ---------------------------
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
// LOGIN USER (Auto-register push token)
// ---------------------------
const loginUser = catchAsync(async (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.ip as string);

  // 👇 Extract pushToken & platform from body
  const { pushToken, platform } = req.body;

  const { accessToken, refreshToken, user } = await AuthServices.loginUserFromDB(
    {
      ...req.body,
      pushToken,
      platform,
    },
    ip,
  );

  // Store refresh token in secure cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logged in successfully',
    data: {
      accessToken,
      user,
    },
  });
});

// ---------------------------
// REFRESH ACCESS TOKEN
// ---------------------------
const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Refresh token missing');
  }

  const result = await AuthServices.refreshAccessToken(token);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
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
// LOGOUT USER (Auto-remove push token)
// ---------------------------
const logoutUser = catchAsync(async (req, res) => {
  const accessToken = req.token;
  const userId = req.user?.id;

  if (!accessToken || !userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized request');
  }

  // Get the pushToken from frontend request (optional)
  const pushToken = req.body?.pushToken || null;

  // Calls service and passes pushToken
  await AuthServices.logoutUser(userId, accessToken, pushToken);

  // Clear refresh token cookie
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

// ---------------------------
// FORGOT PASSWORD
// ---------------------------
const forgotPassword = catchAsync(async (req, res) => {
  const result = await AuthServices.forgotPassword(req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP sent successfully',
    data: result,
  });
});

// ---------------------------
// RESET PASSWORD
// ---------------------------
const resetPassword = catchAsync(async (req, res) => {
  const result = await AuthServices.resetPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successfully',
    data: result,
  });
});

export const AuthControllers = {
  registerUser,
  resendOTP,
  verifyOTP,
  loginUser,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
};
