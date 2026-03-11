import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { MFAControllers } from './mfa.controller';
import { mfaValidation } from './mfa.validation';

const router = express.Router();

// 👉 Setup MFA - Generate Secret & QR Code (Auth Required)
router.post('/setup', auth(), MFAControllers.setupMFA);

// 👉 Verify Setup - Enable MFA (Auth Required)
router.post(
  '/verify-setup',
  auth(),
  validateRequest(mfaValidation.verifySetup),
  MFAControllers.verifySetup,
);

// 👉 Verify MFA - During Login (No Auth Required)
router.post('/verify', validateRequest(mfaValidation.verifyMFA), MFAControllers.verifyMFA);

// 👉 Verify Backup Code - During Login (No Auth Required)
router.post(
  '/verify-backup',
  validateRequest(mfaValidation.verifyBackupCode),
  MFAControllers.verifyBackupCode,
);

// 👉 Disable MFA (Auth Required)
router.post(
  '/disable',
  auth(),
  validateRequest(mfaValidation.disableMFA),
  MFAControllers.disableMFA,
);

// 👉 Get MFA Status (Auth Required)
router.get('/status', auth(), MFAControllers.getMFAStatus);

// 👉 Regenerate Backup Codes (Auth Required)
router.post(
  '/regenerate-backup-codes',
  auth(),
  validateRequest(mfaValidation.regenerateBackupCodes),
  MFAControllers.regenerateBackupCodes,
);

export const MFARouters = router;
