import express from 'express';
import { authValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';

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
router.post('/refreshtoken', AuthControllers.refreshToken);

// 👉 Logout (Auth Required)
router.post('/logout', auth(), AuthControllers.logoutUser);

// 👉 Forgot Password (No Auth Required)
router.post(
  '/forgot-password',
  validateRequest(authValidation.forgotPassword),
  AuthControllers.forgotPassword,
);

// 👉 Reset Password (No Auth Required)
router.post(
  '/reset-password',
  validateRequest(authValidation.resetPassword),
  AuthControllers.resetPassword,
);

export const AuthRouters = router;
