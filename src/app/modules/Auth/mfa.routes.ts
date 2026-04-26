import express from 'express';
import auth from '../../middlewares/auth';
import { createRateLimiter } from '../../middlewares/redisLimit';
import validateRequest from '../../middlewares/validateRequest';
import { MFAControllers } from './mfa.controller';
import { mfaValidation } from './mfa.validation';

const router = express.Router();
const mfaSetupLimiter = createRateLimiter(5, 10, 'mfa-setup');
const mfaVerifyLimiter = createRateLimiter(10, 10, 'mfa-verify');

// 👉 Setup MFA - Generate Secret & QR Code (Auth Required)
router.post('/setup', mfaSetupLimiter, auth(), MFAControllers.setupMFA);

// 👉 Verify Setup - Enable MFA (Auth Required)
router.post(
  '/verify-setup',
  mfaVerifyLimiter,
  auth(),
  validateRequest(mfaValidation.verifySetup),
  MFAControllers.verifySetup,
);

// 👉 Verify MFA - During Login (No Auth Required)
router.post('/verify', mfaVerifyLimiter, validateRequest(mfaValidation.verifyMFA), MFAControllers.verifyMFA);

// 👉 Verify Backup Code - During Login (No Auth Required)
router.post(
  '/verify-backup',
  mfaVerifyLimiter,
  validateRequest(mfaValidation.verifyBackupCode),
  MFAControllers.verifyBackupCode,
);

// 👉 Disable MFA (Auth Required)
router.post(
  '/disable',
  mfaVerifyLimiter,
  auth(),
  validateRequest(mfaValidation.disableMFA),
  MFAControllers.disableMFA,
);

// 👉 Get MFA Status (Auth Required)
router.get('/status', auth(), MFAControllers.getMFAStatus);

// 👉 Regenerate Backup Codes (Auth Required)
router.post(
  '/regenerate-backup-codes',
  mfaVerifyLimiter,
  auth(),
  validateRequest(mfaValidation.regenerateBackupCodes),
  MFAControllers.regenerateBackupCodes,
);

export const MFARouters = router;
