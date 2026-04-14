import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/db';
import { MFAService } from '../../../lib/mfaService';
import ApiError from '../../errors/ApiErrors';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { setAuthCookies } from './auth.constants';
import { issueAuthSessionTokens } from './auth.session';

// ---------------------------
// SETUP MFA - Generate Secret & QR Code
// ---------------------------
const setupMFA = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;

  // Check if MFA is already enabled
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });

  if (user?.mfaEnabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'MFA is already enabled for this account');
  }

  // Generate secret
  const { secret, otpauthUrl } = MFAService.generateSecret(userId, userEmail);

  // Generate QR code
  const qrCodeDataUrl = await MFAService.generateQRCode(otpauthUrl);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'MFA setup initiated. Scan the QR code with your authenticator app.',
    data: {
      secret,
      qrCode: qrCodeDataUrl,
    },
  });
});

// ---------------------------
// VERIFY SETUP - Verify TOTP & Enable MFA
// ---------------------------
const verifySetup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { secret, token } = req.body;

  // Verify the TOTP token
  const isValid = MFAService.verifyToken(secret, token);

  if (!isValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid verification code. Please try again.');
  }

  // Generate backup codes
  const backupCodes = MFAService.generateBackupCodes();
  const hashedBackupCodes = await MFAService.hashBackupCodes(backupCodes);

  // Enable MFA
  await MFAService.enableMFA(userId, secret, hashedBackupCodes);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Two-factor authentication enabled successfully',
    data: {
      backupCodes,
    },
  });
});

// ---------------------------
// VERIFY MFA - During Login
// ---------------------------
const verifyMFA = catchAsync(async (req, res) => {
  const { tempToken, token } = req.body;

  // Verify temporary token
  const decoded = jwt.verify(tempToken, process.env.JWT_SECRET as string) as {
    id: string;
    email: string;
    type: string;
  };

  if (decoded.type !== 'mfa_temp') {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid temporary token');
  }

  // Get user with MFA details
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      mfaEnabled: true,
      mfaSecret: true,
    },
  });

  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'MFA is not enabled for this account');
  }

  // Verify TOTP token
  const isValid = MFAService.verifyToken(user.mfaSecret, token);

  if (!isValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid verification code');
  }

  const { accessToken, refreshToken } = await issueAuthSessionTokens(
    { id: user.id, email: user.email, role: user.role },
    { event: 'mfa-verify-issue' },
  );

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  setAuthCookies(res, { accessToken, refreshToken });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'MFA verification successful',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    },
  });
});

// ---------------------------
// VERIFY BACKUP CODE - During Login
// ---------------------------
const verifyBackupCode = catchAsync(async (req, res) => {
  const { tempToken, backupCode } = req.body;

  // Verify temporary token
  const decoded = jwt.verify(tempToken, process.env.JWT_SECRET as string) as {
    id: string;
    email: string;
    type: string;
  };

  if (decoded.type !== 'mfa_temp') {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid temporary token');
  }

  // Get user with MFA details
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      mfaEnabled: true,
      mfaBackupCodes: true,
    },
  });

  if (!user || !user.mfaEnabled) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'MFA is not enabled for this account');
  }

  // Verify backup code
  const codeIndex = await MFAService.verifyBackupCode(backupCode, user.mfaBackupCodes);

  if (codeIndex === -1) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid backup code');
  }

  // Consume the backup code
  await MFAService.consumeBackupCode(user.id, codeIndex);

  const { accessToken, refreshToken } = await issueAuthSessionTokens(
    { id: user.id, email: user.email, role: user.role },
    { event: 'mfa-backup-issue' },
  );

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  setAuthCookies(res, { accessToken, refreshToken });

  const remainingCodes = user.mfaBackupCodes.length - 1;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Backup code verification successful',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      remainingBackupCodes: remainingCodes,
    },
  });
});

// ---------------------------
// DISABLE MFA
// ---------------------------
const disableMFA = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { token } = req.body;

  // Get user's MFA secret
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, mfaSecret: true },
  });

  if (!user?.mfaEnabled || !user.mfaSecret) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'MFA is not enabled for this account');
  }

  // Verify TOTP token before disabling
  const isValid = MFAService.verifyToken(user.mfaSecret, token);

  if (!isValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid verification code');
  }

  // Disable MFA
  await MFAService.disableMFA(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Two-factor authentication disabled successfully',
    data: null,
  });
});

// ---------------------------
// GET MFA STATUS
// ---------------------------
const getMFAStatus = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const status = await MFAService.getMFAStatus(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'MFA status retrieved successfully',
    data: status,
  });
});

// ---------------------------
// REGENERATE BACKUP CODES
// ---------------------------
const regenerateBackupCodes = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { token } = req.body;

  // Get user's MFA secret
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, mfaSecret: true },
  });

  if (!user?.mfaEnabled || !user.mfaSecret) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'MFA is not enabled for this account');
  }

  // Verify TOTP token before regenerating
  const isValid = MFAService.verifyToken(user.mfaSecret, token);

  if (!isValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid verification code');
  }

  // Regenerate backup codes
  const newBackupCodes = await MFAService.regenerateBackupCodes(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Backup codes regenerated successfully',
    data: {
      backupCodes: newBackupCodes,
    },
  });
});

export const MFAControllers = {
  setupMFA,
  verifySetup,
  verifyMFA,
  verifyBackupCode,
  disableMFA,
  getMFAStatus,
  regenerateBackupCodes,
};
