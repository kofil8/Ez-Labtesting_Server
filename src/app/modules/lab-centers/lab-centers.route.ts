import { Router } from 'express';
import { createRateLimiter } from '../../middlewares/redisLimit';
import validateRequest from '../../middlewares/validateRequest';
import { LabCenterController } from './lab-centers.controller';
import {
  autocompleteQuerySchema,
  geocodeSchema,
  labCenterParamsSchema,
  labCenterQuerySchema,
  nationwideLabQuerySchema,
  placeDetailsParamsSchema,
} from './lab-centers.validation';

const router = Router();
const publicLocatorLimiter = createRateLimiter(60, 10, 'lab-centers');
const autocompleteLimiter = createRateLimiter(80, 10, 'lab-centers-autocomplete');

router.get('/', publicLocatorLimiter, validateRequest(labCenterQuerySchema), LabCenterController.getLabCenters);
router.get(
  '/nationwide',
  publicLocatorLimiter,
  validateRequest(nationwideLabQuerySchema),
  LabCenterController.getNationwideLabCenters,
);
router.post('/geocode', publicLocatorLimiter, validateRequest(geocodeSchema), LabCenterController.geocode);
router.get(
  '/autocomplete',
  autocompleteLimiter,
  validateRequest(autocompleteQuerySchema),
  LabCenterController.autocomplete,
);
router.get(
  '/place-details/:placeId',
  publicLocatorLimiter,
  validateRequest(placeDetailsParamsSchema),
  LabCenterController.getPlaceDetails,
);
router.get(
  '/:labCenterId',
  publicLocatorLimiter,
  validateRequest(labCenterParamsSchema),
  LabCenterController.getLabCenterById,
);

export const LabCenterRoutes = router;
