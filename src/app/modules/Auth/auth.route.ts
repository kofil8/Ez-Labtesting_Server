import express from 'express';
import { authValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import validateRequest from '@/app/middlewares/validateRequest';
import auth from '@/app/middlewares/auth';

const router = express.Router();

// 👉 Login (No Auth Required)
router.post('/login', validateRequest(authValidation.loginUser), AuthControllers.loginUser);

// 👉 Refresh Token (No Auth Required)
router.post(
  '/refresh-token',
  validateRequest(authValidation.refreshToken),
  AuthControllers.refreshToken,
);

// 👉 Logout (Auth Required)
router.post('/logout', auth(), AuthControllers.logoutUser);

export const AuthRouters = router;
