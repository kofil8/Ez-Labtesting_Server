import { Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { AuthServices } from './auth.service';
import { clearAuthCookies, setAuthCookies } from './auth.constants';

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
// LOGIN USER
// ---------------------------
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  const { pushToken, platform } = req.body;

  const result = await AuthServices.loginUserFromDB(
    {
      ...req.body,
      pushToken,
      platform,
    },
    ip,
  );

  if (result.mfaRequired) {
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'MFA verification required',
      data: {
        mfaRequired: true,
        tempToken: result.tempToken,
        user: result.user,
        isFirstLogin: result.isFirstLogin,
      },
    });
    return;
  }

  const { accessToken, refreshToken, user } = result;
  if (!accessToken || !refreshToken) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Authentication tokens were not issued');
  }

  setAuthCookies(res, { accessToken, refreshToken });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logged in successfully',
    data: {
      accessToken,
      refreshToken,
      user,
      isFirstLogin: result.isFirstLogin,
    },
  });
});

// ---------------------------
// REFRESH TOKEN
// ---------------------------
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Refresh token missing');
  }

  const result = await AuthServices.refreshAccessToken(token);

  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Token refreshed successfully',
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

// ---------------------------
// LOGOUT USER
// ---------------------------
const logoutUser = catchAsync(async (req, res) => {
  const accessToken = req.token;
  const userId = req.user?.id;
  const refreshToken = req.cookies?.refreshToken ?? null;

  if (!accessToken || !userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized request');
  }

  const pushToken = req.body?.pushToken || null;

  await AuthServices.logoutUser(userId, accessToken, refreshToken, pushToken);

  clearAuthCookies(res);

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
