import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../errors/ApiErrors';
import stateRestrictionService from '../modules/stateRestriction/stateRestriction.service';

export const RESTRICTED_ORDERING_MESSAGE =
  "We're coming soon to this location. Your IP location is currently restricted for online ordering.";

export async function enforceCustomerOrderingAvailability(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const authUser = (req as Request & { user?: { role?: string } }).user;

    if (authUser?.role !== Role.CUSTOMER) {
      next();
      return;
    }

    const status = await stateRestrictionService.getLocationStatus({ req });

    if (status.canOrder) {
      next();
      return;
    }

    throw new ApiError(
      httpStatus.FORBIDDEN,
      RESTRICTED_ORDERING_MESSAGE,
      {
        stateCode: status.effectiveStateCode || status.detectedStateCode,
        detectedStateCode: status.detectedStateCode,
        laboratoryRoute: status.laboratoryRoute,
        restrictionType: status.restrictionType,
        source: status.source,
      },
      'REGION_RESTRICTED',
    );
  } catch (error) {
    next(error);
  }
}
