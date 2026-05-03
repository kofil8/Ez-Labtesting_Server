import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import stateRestrictionController from '../stateRestriction/stateRestriction.controller';
import { getLocationStatusSchema } from '../stateRestriction/stateRestriction.validation';

const router = Router();

router.get(
  '/restriction-status',
  validateRequest(getLocationStatusSchema),
  stateRestrictionController.getLocationStatus,
);

export default router;
