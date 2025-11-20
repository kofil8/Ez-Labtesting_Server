import ApiError from '@/app/errors/ApiErrors';
import catchAsync from '@/app/helpers/catchAsync';
import sendResponse from '@/app/helpers/sendResponse';
import httpStatus from 'http-status';
import { AuthServices } from './auth.service';

const loginUser = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUserFromDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logged in successfully',
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required');
  }

  const result = await AuthServices.refreshAccessToken(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Token refreshed successfully',
    data: result,
  });
});

const logoutUser = catchAsync(async (req, res) => {
  const accessToken = req.token;
  const userId = req.user?.id;

  if (!accessToken || !userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized request');
  }

  await AuthServices.logoutUser(userId, accessToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Logged out successfully',
    data: null,
  });
});

export const AuthControllers = {
  loginUser,
  refreshToken,
  logoutUser,
};
