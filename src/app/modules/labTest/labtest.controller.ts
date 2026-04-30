import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import labTestService from './labtest.service';

const asParamString = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

class LabTestController {
  async createLabTest(req: Request, res: Response, next: NextFunction) {
    try {
      const labTest = await labTestService.createLabTest(req.body);

      res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Lab test created successfully',
        data: labTest,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLabTests(req: Request, res: Response, next: NextFunction) {
    try {
      const labTests = await labTestService.getLabTests({
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
        search: req.query.search as string | undefined,
        testId: req.query.testId as string | undefined,
        laboratoryId: req.query.laboratoryId as string | undefined,
        isAvailable: req.query.isAvailable as string | undefined,
        isVisible: req.query.isVisible as string | undefined,
        sortBy: req.query.sortBy as
          | 'labTestCode'
          | 'retailPrice'
          | 'salePrice'
          | 'sortOrder'
          | 'createdAt'
          | 'updatedAt'
          | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      });

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Lab tests retrieved successfully',
        meta: labTests.meta,
        data: labTests.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLabTestById(req: Request, res: Response, next: NextFunction) {
    try {
      const labTestId = asParamString(req.params.labTestId);
      const labTest = await labTestService.getLabTestById(labTestId);

      if (!labTest) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Lab test not found');
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Lab test retrieved successfully',
        data: labTest,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLabTest(req: Request, res: Response, next: NextFunction) {
    try {
      const labTestId = asParamString(req.params.labTestId);
      const labTest = await labTestService.updateLabTest(labTestId, req.body);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Lab test updated successfully',
        data: labTest,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new LabTestController();
