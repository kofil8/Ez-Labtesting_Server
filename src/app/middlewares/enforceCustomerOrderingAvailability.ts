import { NextFunction, Request, Response } from 'express';
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

    if (!authUser || authUser.role !== 'CUSTOMER') {
      next();
      return;
    }

    const status = await stateRestrictionService.assertOrderingAllowed({ req });
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

    next();
  } catch (error) {
    next(error);
  }
}
