import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { UsersService } from './users.service';

const asParamString = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const options = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    searchTerm: req.query.searchTerm as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as 'asc' | 'desc',
    role: req.query.role as string,
  };
  const result = await UsersService.getUsersFromDB(options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getUserById = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await UsersService.getUserByIdFromDB(asParamString(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UsersService.deleteUserFromDB(asParamString(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UsersService.createUserInDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'User created successfully',
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UsersService.updateUserInDB(asParamString(req.params.id), req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.id;
  const result = await UsersService.getUserByIdFromDB(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const updateMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.id;
  const result = await UsersService.updateMeInDB(userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});
export const UsersController = {
  getUsers,
  getUserById,
  deleteUser,
  createUser,
  updateUser,
  getMe,
  updateMe,
};
