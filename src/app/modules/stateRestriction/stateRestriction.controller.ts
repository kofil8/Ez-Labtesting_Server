import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import stateRestrictionService from './stateRestriction.service';

const asParamString = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

class StateRestrictionController {
  async getLocationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await stateRestrictionService.getLocationStatus({
        req,
        checkoutState: req.query.checkoutState as string | undefined,
        testId: req.query.testId as string | undefined,
        laboratoryId: req.query.laboratoryId as string | undefined,
        publicIp: req.query.publicIp as string | undefined,
        laboratoryCode: req.query.laboratoryCode as string | undefined,
      });

      res.status(httpStatus.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRestriction(req: Request, res: Response, next: NextFunction) {
    try {
      const restriction = await stateRestrictionService.createRestriction(req.body);

      res.status(httpStatus.CREATED).json({
        success: true,
        message: 'State restriction created successfully',
        data: restriction,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRestrictions(req: Request, res: Response, next: NextFunction) {
    try {
      const restrictions = await stateRestrictionService.getRestrictions({
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
        stateCode: req.query.stateCode as string | undefined,
        testId: req.query.testId as string | undefined,
        laboratoryId: req.query.laboratoryId as string | undefined,
        restrictionType: req.query.restrictionType as
          | 'BLOCKED'
          | 'REQUIRES_PHYSICIAN'
          | undefined,
        isActive: req.query.isActive as string | undefined,
        sortBy: req.query.sortBy as
          | 'stateCode'
          | 'restrictionType'
          | 'createdAt'
          | 'updatedAt'
          | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      });

      res.status(httpStatus.OK).json({
        success: true,
        message: 'State restrictions retrieved successfully',
        meta: restrictions.meta,
        data: restrictions.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRestrictionById(req: Request, res: Response, next: NextFunction) {
    try {
      const restrictionId = asParamString(req.params.restrictionId);
      const restriction = await stateRestrictionService.getRestrictionById(restrictionId);

      if (!restriction) {
        throw new ApiError(httpStatus.NOT_FOUND, 'State restriction not found');
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: 'State restriction retrieved successfully',
        data: restriction,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRestriction(req: Request, res: Response, next: NextFunction) {
    try {
      const restrictionId = asParamString(req.params.restrictionId);
      const restriction = await stateRestrictionService.updateRestriction(restrictionId, req.body);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'State restriction updated successfully',
        data: restriction,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new StateRestrictionController();
