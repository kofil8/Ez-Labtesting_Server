import express from 'express';
import { authValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { createRateLimiter, loginLimiter } from '../../middlewares/redisLimit';

const router = express.Router();
const authWriteLimiter = createRateLimiter(20, 15, 'auth-write');
const otpRequestLimiter = createRateLimiter(5, 10, 'auth-otp-request');
const otpVerifyLimiter = createRateLimiter(10, 10, 'auth-otp-verify');
const refreshLimiter = createRateLimiter(30, 15, 'auth-refresh');

//Register
router.post(
  '/register',
  authWriteLimiter,
  validateRequest(authValidation.register),
  AuthControllers.registerUser,
);

// 👉 Resend OTP (No Auth Required)
router.post(
  '/resend-otp',
  otpRequestLimiter,
  validateRequest(authValidation.resendOTP),
  AuthControllers.resendOTP,
);

// 👉 Verify OTP (No Auth Required)
router.post(
  '/verify-otp',
  otpVerifyLimiter,
  validateRequest(authValidation.verifyOTP),
  AuthControllers.verifyOTP,
);

// 👉 Login (No Auth Required)
router.post('/login', loginLimiter, validateRequest(authValidation.loginUser), AuthControllers.loginUser);

// 👉 Refresh Token (No Auth Required)
router.post('/refreshtoken', refreshLimiter, AuthControllers.refreshToken);

// 👉 Logout (Auth Required)
router.post('/logout', auth(), AuthControllers.logoutUser);

// 👉 Forgot Password (No Auth Required)
router.post(
  '/forgot-password',
  otpRequestLimiter,
  validateRequest(authValidation.forgotPassword),
  AuthControllers.forgotPassword,
);

// 👉 Reset Password (No Auth Required)
router.post(
  '/reset-password',
  otpVerifyLimiter,
  validateRequest(authValidation.resetPassword),
  AuthControllers.resetPassword,
);

export const AuthRouters = router;
