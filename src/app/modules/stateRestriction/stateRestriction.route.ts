import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import stateRestrictionController from './stateRestriction.controller';
import {
  createRestrictionSchema,
  getLocationStatusSchema,
  getRestrictionByIdSchema,
  getRestrictionsSchema,
  updateRestrictionSchema,
} from './stateRestriction.validation';

const router = Router();

router.get(
  '/location-status',
  validateRequest(getLocationStatusSchema),
  stateRestrictionController.getLocationStatus,
);

router.use(auth('ADMIN', 'SUPER_ADMIN'));

router.post('/', validateRequest(createRestrictionSchema), stateRestrictionController.createRestriction);
router.get('/', validateRequest(getRestrictionsSchema), stateRestrictionController.getRestrictions);
router.get(
  '/:restrictionId',
  validateRequest(getRestrictionByIdSchema),
  stateRestrictionController.getRestrictionById,
);
router.patch(
  '/:restrictionId',
  validateRequest(updateRestrictionSchema),
  stateRestrictionController.updateRestriction,
);

export default router;
