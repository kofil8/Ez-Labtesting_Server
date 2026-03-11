import { Role } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { LabCenterController } from './lab-centers.controller';
import {
  autocompleteQuerySchema,
  createLabCenterSchema,
  geocodeSchema,
  labCenterQuerySchema,
  placeDetailsParamsSchema,
  updateLabCenterSchema,
} from './lab-centers.validation';

const router = express.Router();

// Public routes
router.get('/', validateRequest(labCenterQuerySchema), LabCenterController.getLabCenters);

// Geocode route MUST come before :id to avoid route collision
router.post('/geocode', validateRequest(geocodeSchema), LabCenterController.geocode);
router.get(
  '/autocomplete',
  validateRequest(autocompleteQuerySchema),
  LabCenterController.autocomplete,
);
router.get(
  '/place-details/:placeId',
  validateRequest(placeDetailsParamsSchema),
  LabCenterController.getPlaceDetails,
);

router.get('/:id', LabCenterController.getLabCenterById);

// Admin-only routes
router.post(
  '/',
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(createLabCenterSchema),
  LabCenterController.createLabCenter,
);

router.put(
  '/:id',
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(updateLabCenterSchema),
  LabCenterController.updateLabCenter,
);

router.delete('/:id', auth(Role.SUPER_ADMIN, Role.ADMIN), LabCenterController.deleteLabCenter);

export const LabCenterRoutes = router;
