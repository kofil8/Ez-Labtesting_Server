import express from 'express';
import { authValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import validateRequest from '@/app/middlewares/validateRequest';
import auth from '@/app/middlewares/auth';

const router = express.Router();

//Register
router.post('/register', validateRequest(authValidation.register), AuthControllers.registerUser);

// 👉 Resend OTP (No Auth Required)
router.post('/resend-otp', validateRequest(authValidation.resendOTP), AuthControllers.resendOTP);

// 👉 Verify OTP (No Auth Required)
router.post('/verify-otp', validateRequest(authValidation.verifyOTP), AuthControllers.verifyOTP);

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
