import express from 'express';
import upload, { setS3Folder } from '../../helpers/fileUploadHelper';
import auth from '../../middlewares/auth';
import { TestController } from './tests.controller';

const router = express.Router();

router.get('/all', auth(), TestController.getTests);

router.get('/:testId', auth(), TestController.getTestById);

router.post(
  '/',
  auth(),
  // validateRequest(TestValidation.createTest),
  setS3Folder('test'),
  upload.single('testImage'),
  TestController.createTest,
);

router.patch(
  '/:testId',
  auth(),
  setS3Folder('test'),
  upload.single('testImage'),
  TestController.updateTest,
);

router.delete('/:testId', auth(), TestController.deleteTest);

export const TestsRouters = router;
