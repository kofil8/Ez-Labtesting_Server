import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import httpStatus from 'http-status';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import ApiError from '../app/errors/ApiErrors';
import { prisma } from '../config/db';

export class MFAService {
  /**
   * Generate a new TOTP secret for a user
   * @param userId - User ID
   * @param userEmail - User email for QR code label
   * @returns Secret key and OTPAuth URL
   */
  static generateSecret(userId: string, userEmail: string) {
    const secret = speakeasy.generateSecret({
      name: `EzLabTesting (${userEmail})`,
      issuer: 'EzLabTesting',
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url as string,
    };
  }

  /**
   * Generate QR code data URL for TOTP setup
   * @param otpauthUrl - OTPAuth URL from secret generation
   * @returns Base64 data URL for QR code image
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP code against a secret
   * @param secret - Base32 encoded secret
   * @param token - 6-digit TOTP code from user
   * @param window - Time window for verification (default 1 = 30 seconds before/after)
   * @returns Boolean indicating if token is valid
   */
  static verifyToken(secret: string, token: string, window: number = 1): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window,
    });
  }

  /**
   * Generate backup codes for account recovery
   * @param count - Number of backup codes to generate (default 12)
   * @returns Array of backup codes
   */
  static generateBackupCodes(count: number = 12): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(6).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash backup codes for secure storage
   * @param codes - Array of plain text backup codes
   * @returns Array of hashed backup codes
   */
  static async hashBackupCodes(codes: string[]): Promise<string[]> {
    const hashedCodes = await Promise.all(
      codes.map(async (code) => {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(code, salt);
      }),
    );
    return hashedCodes;
  }

  /**
   * Verify a backup code against stored hashed codes
   * @param code - Plain text backup code from user
   * @param hashedCodes - Array of hashed backup codes from database
   * @returns Index of matched code, or -1 if no match
   */
  static async verifyBackupCode(code: string, hashedCodes: string[]): Promise<number> {
    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await bcrypt.compare(code, hashedCodes[i]);
      if (isMatch) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Enable MFA for a user
   * @param userId - User ID
   * @param secret - Base32 encoded TOTP secret
   * @param backupCodes - Array of hashed backup codes
   */
  static async enableMFA(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: secret,
        mfaBackupCodes: backupCodes,
        mfaSetupAt: new Date(),
      },
    });
  }

  /**
   * Disable MFA for a user
   * @param userId - User ID
   */
  static async disableMFA(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
        mfaSetupAt: null,
      },
    });
  }

  /**
   * Consume (remove) a used backup code
   * @param userId - User ID
   * @param codeIndex - Index of the backup code to remove
   */
  static async consumeBackupCode(userId: string, codeIndex: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaBackupCodes: true },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    const updatedCodes = [...user.mfaBackupCodes];
    updatedCodes.splice(codeIndex, 1);

    await prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: updatedCodes },
    });
  }

  /**
   * Regenerate backup codes for a user
   * @param userId - User ID
   * @returns New plain text backup codes
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    if (!user || !user.mfaEnabled) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'MFA is not enabled for this user');
    }

    const newCodes = this.generateBackupCodes();
    const hashedCodes = await this.hashBackupCodes(newCodes);

    await prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: hashedCodes },
    });

    return newCodes;
  }

  /**
   * Check if MFA is enabled for a user
   * @param userId - User ID
   * @returns MFA status
   */
  static async getMFAStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaEnabled: true,
        mfaSetupAt: true,
        mfaBackupCodes: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return {
      mfaEnabled: user.mfaEnabled,
      mfaSetupAt: user.mfaSetupAt,
      backupCodesCount: user.mfaBackupCodes.length,
    };
  }
}
