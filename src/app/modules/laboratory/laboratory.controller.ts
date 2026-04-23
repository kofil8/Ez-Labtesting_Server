import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import laboratoryService from './laboratory.service';

const asParamString = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

class LaboratoryController {
  async createLaboratory(req: Request, res: Response, next: NextFunction) {
    try {
      const laboratory = await laboratoryService.createLaboratory(req.body);

      res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Laboratory created successfully',
        data: laboratory,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLaboratories(req: Request, res: Response, next: NextFunction) {
    try {
      const laboratories = await laboratoryService.getLaboratories({
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
        search: req.query.search as string | undefined,
        isActive: req.query.isActive as string | undefined,
        isVisibleToCustomers: req.query.isVisibleToCustomers as string | undefined,
        sortBy: req.query.sortBy as
          | 'name'
          | 'code'
          | 'sortOrder'
          | 'createdAt'
          | 'updatedAt'
          | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      });

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Laboratories retrieved successfully',
        meta: laboratories.meta,
        data: laboratories.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLaboratoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const laboratoryId = asParamString(req.params.laboratoryId);
      const laboratory = await laboratoryService.getLaboratoryById(laboratoryId);

      if (!laboratory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Laboratory not found');
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Laboratory retrieved successfully',
        data: laboratory,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLaboratory(req: Request, res: Response, next: NextFunction) {
    try {
      const laboratoryId = asParamString(req.params.laboratoryId);
      const laboratory = await laboratoryService.updateLaboratory(laboratoryId, req.body);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Laboratory updated successfully',
        data: laboratory,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLaboratory(req: Request, res: Response, next: NextFunction) {
    try {
      const laboratoryId = asParamString(req.params.laboratoryId);
      await laboratoryService.deleteLaboratory(laboratoryId);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Laboratory deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new LaboratoryController();
