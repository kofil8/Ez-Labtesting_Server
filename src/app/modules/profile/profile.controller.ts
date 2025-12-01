import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
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

const updateMyProfile = catchAsync(
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    const id = req.user?.id as string;
    const payload = req.body.bodyData;
    const file = req.file as Express.Multer.File | undefined;
    const result = await ProfileService.updateMyProfileIntoDB(id, payload, file);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User profile updated successfully',
      data: result,
    });
  },
);

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
  updateMyProfile,
  changePassword,
};
