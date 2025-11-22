import express, { NextFunction, Request, Response } from 'express';
import auth from '@/app/middlewares/auth';
import { ProfileController } from './profile.controller';
import { FileUploadHelper } from '@/app/helpers/fileUploadHelper';
import validateRequest from '@/app/middlewares/validateRequest';
import { ProfileValidation } from './profile.validation';

const router = express.Router();

router.get('/', auth(), ProfileController.getProfile);

router.patch(
  '/',
  auth(),
  FileUploadHelper.upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  validateRequest(ProfileValidation.updateProfile),
  ProfileController.updateProfile,
);

router.post(
  '/change-password',
  auth(),
  validateRequest(ProfileValidation.changePassword),
  ProfileController.changePassword,
);

export const ProfileRouters = router;
