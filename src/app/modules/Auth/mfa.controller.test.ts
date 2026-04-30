jest.mock('../../../config/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../lib/mfaService', () => ({
  MFAService: {
    verifyToken: jest.fn(),
    verifyBackupCode: jest.fn(),
    consumeBackupCode: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('./auth.session', () => ({
  issueAuthSessionTokens: jest.fn(),
}));

import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/db';
import { MFAService } from '../../../lib/mfaService';
import { accessCookieOptions, refreshCookieOptions } from './auth.constants';
import { MFAControllers } from './mfa.controller';
import { issueAuthSessionTokens } from './auth.session';

const createResponse = () => {
  const res: any = {};
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('MFAControllers session issuance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue({
      id: 'user-1',
      email: 'user@example.com',
      type: 'mfa_temp',
    });
    (issueAuthSessionTokens as jest.Mock).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({});
  });

  it('verifyMFA issues Redis-backed auth session tokens and shared cookies', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
      mfaEnabled: true,
      mfaSecret: 'secret',
    });
    (MFAService.verifyToken as jest.Mock).mockReturnValue(true);

    const req: any = { body: { tempToken: 'temp-token', token: '123456' } };
    const res = createResponse();
    const next = jest.fn();

    await MFAControllers.verifyMFA(req, res, next);

    expect(issueAuthSessionTokens).toHaveBeenCalledWith(
      { id: 'user-1', email: 'user@example.com', role: 'CUSTOMER' },
      { event: 'mfa-verify-issue' },
    );
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', refreshCookieOptions);
    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'access-token', accessCookieOptions);
    expect(next).not.toHaveBeenCalled();
  });

  it('verifyBackupCode issues Redis-backed auth session tokens and shared cookies', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
      mfaEnabled: true,
      mfaBackupCodes: ['code-1', 'code-2'],
    });
    (MFAService.verifyBackupCode as jest.Mock).mockResolvedValue(0);
    (MFAService.consumeBackupCode as jest.Mock).mockResolvedValue(undefined);

    const req: any = { body: { tempToken: 'temp-token', backupCode: 'BACKUP-1' } };
    const res = createResponse();
    const next = jest.fn();

    await MFAControllers.verifyBackupCode(req, res, next);

    expect(issueAuthSessionTokens).toHaveBeenCalledWith(
      { id: 'user-1', email: 'user@example.com', role: 'CUSTOMER' },
      { event: 'mfa-backup-issue' },
    );
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', refreshCookieOptions);
    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'access-token', accessCookieOptions);
    expect(next).not.toHaveBeenCalled();
  });
});
