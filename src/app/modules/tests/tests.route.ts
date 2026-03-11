import { Role } from '@prisma/client';
import express from 'express';
import upload, { setS3Folder } from '../../helpers/fileUploadHelper';
import auth from '../../middlewares/auth';
import { TestController } from './tests.controller';

const router = express.Router();

// Public route - returns only published and active tests
router.get('/all', TestController.getTests);

router.get('/:testId', TestController.getTestById);

router.post(
  '/',
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  setS3Folder('test'),
  upload.single('testImage'),
  TestController.createTest,
);

router.patch(
  '/:testId',
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  setS3Folder('test'),
  upload.single('testImage'),
  TestController.updateTest,
);

router.delete('/:testId', auth(Role.SUPER_ADMIN, Role.ADMIN), TestController.deleteTest);

export const TestsRouters = router;
