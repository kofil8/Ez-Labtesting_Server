import express from 'express';
import auth from '../../middlewares/auth';
import { ProfileController } from './profile.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ProfileValidation } from './profile.validation';
import upload, { setS3Folder } from '../../helpers/fileUploadHelper';
import parseBodyData from '../../helpers/parseBodyData';

const router = express.Router();

router.get('/', auth(), ProfileController.getProfile);

router.patch(
  '/',
  auth(),
  setS3Folder('profile'),
  upload.single('file'),
  parseBodyData,
  validateRequest(ProfileValidation.updateProfile),
  ProfileController.updateMyProfile,
);

router.post(
  '/change-password',
  auth(),
  validateRequest(ProfileValidation.changePassword),
  ProfileController.changePassword,
);

export const ProfileRouters = router;
