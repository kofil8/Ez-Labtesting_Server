import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { TestServices } from './tests.service';

const getTests = catchAsync(async (req, res) => {
  const tests = await TestServices.getTestsDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Tests retrieved successfully',
    meta: tests.meta,
    data: tests.data,
  });
});

const getTestById = catchAsync(async (req, res) => {
  const { testId } = req.params;

  const test = await TestServices.getTestByIdDB(testId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Test retrieved successfully',
    data: test,
  });
});

const createTest = catchAsync(
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    const payload = req.body;
    const file = req.file as Express.Multer.File | undefined;
    const test = await TestServices.createTestInDB(payload, file);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: 'Test created successfully',
      data: test,
    });
  },
);

const updateTest = catchAsync(
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    const { testId } = req.params;
    const payload = req.body;
    const file = req.file as Express.Multer.File | undefined;

    const test = await TestServices.updateTestInDB(testId, payload, file);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Test updated successfully',
      data: test,
    });
  },
);

const deleteTest = catchAsync(async (req, res) => {
  const { testId } = req.params;

  const test = await TestServices.deleteTestFromDB(testId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Test deleted successfully',
    data: test,
  });
});

export const TestController = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
};
