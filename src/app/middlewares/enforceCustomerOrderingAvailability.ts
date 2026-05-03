import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import stateRestrictionService from '../modules/stateRestriction/stateRestriction.service';
import logger from '../utils/logger';

export const RESTRICTED_ORDERING_MESSAGE =
  'We are coming soon to your area. Ordering is currently unavailable in your state.';

export async function enforceCustomerOrderingAvailability(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const authUser = (req as Request & { user?: { role?: string } }).user;

    if (!authUser) {
      next();
      return;
    }

    const status = await stateRestrictionService.getLocationStatus({ req });
    const decision = stateRestrictionService.buildRestrictionDecision(status);

    logger.info(
      JSON.stringify({
        event: 'restriction_check',
        ip: status.maskedIp || status.ip || null,
        stateCode: decision.stateCode || null,
        route: req.originalUrl || req.path,
        restricted: decision.restricted,
      }),
    );

    if (status.canOrder) {
      next();
      return;
    }

    _res.status(httpStatus.FORBIDDEN).json({
      success: false,
      code: 'RESTRICTED_STATE',
      message: RESTRICTED_ORDERING_MESSAGE,
      stateCode: decision.stateCode,
      stateName: decision.stateName,
    });
  } catch (error) {
    next(error);
  }
}
