import { Request, Response } from 'express';
import catchAsync from '@/app/helpers/catchAsync';
import sendResponse from '@/app/helpers/sendResponse';
import httpStatus from 'http-status';
import { ProfileService } from './profile.service';

const getProfile = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await ProfileService.getProfileFromDB(req.user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  // Handle multipart/form-data: body is parsed by multer, but we might need to parse JSON fields if they are sent as strings
  if (req.body.data) {
      try {
          req.body = JSON.parse(req.body.data);
      } catch (error) {
          // ignore if not json string
      }
  }
  
  const result = await ProfileService.updateProfileInDB(req.user.id, req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await ProfileService.changePasswordInDB(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});

export const ProfileController = {
  getProfile,
  updateProfile,
  changePassword,
};
