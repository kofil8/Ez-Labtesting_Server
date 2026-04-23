import { Role } from '@prisma/client';
import express from 'express';
import upload, { setS3Folder } from '../../helpers/fileUploadHelper';
import parseBodyData from '../../helpers/parseBodyData';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { TestController } from './tests.controller';
import { TestValidation } from './tests.validation';

const router = express.Router();

// Public routes
router.get('/all', validateRequest(TestValidation.getTests), TestController.getTests);
router.get(
  '/:testId/components',
  validateRequest(TestValidation.getPanelComponents),
  TestController.getPanelComponents,
);

router.get('/:testId', validateRequest(TestValidation.getTestById), TestController.getTestById);

// Admin routes
router.post(
  '/',
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  setS3Folder('test'),
  upload.single('testImage'),
  parseBodyData,
  validateRequest(TestValidation.createTest),
  TestController.createTest,
);

router.patch(
  '/:testId',
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  setS3Folder('test'),
  upload.single('testImage'),
  parseBodyData,
  validateRequest(TestValidation.updateTest),
  TestController.updateTest,
);

router.patch(
  '/:testId/components',
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  parseBodyData,
  validateRequest(TestValidation.updatePanelComponents),
  TestController.updatePanelComponents,
);

router.delete(
  '/:testId',
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(TestValidation.getTestById),
  TestController.deleteTest,
);

export const TestsRouters = router;
