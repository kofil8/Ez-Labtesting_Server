import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { UsersService } from './users.service';

const asParamString = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const sortOrderParam = (req.query.sortOrder as string)?.toLowerCase();
  const validSortOrder: 'asc' | 'desc' = sortOrderParam === 'asc' ? 'asc' : 'desc';

  // Accept both 'limit' and 'total' as alias for items per page
  const limitValue = req.query.limit || req.query.total;

  // Accept 'search', 'search' and common typos
  const searchValue =
    req.query.search || req.query.search || req.query.serachTerm || req.query.serach;

  const options = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: limitValue ? parseInt(limitValue as string, 10) : undefined,
    search: (searchValue as string)?.trim() || undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: validSortOrder,
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

export const UsersController = {
  getUsers,
  getUserById,
  deleteUser,
  createUser,
  updateUser,
};
