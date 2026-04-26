import { z } from 'zod';

const verifySetup = z.object({
  body: z.object({
    secret: z
      .string({
        required_error: 'Secret is required',
      })
      .min(1, 'Secret cannot be empty'),
    token: z
      .string({
        required_error: 'Verification code is required',
      })
      .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  }),
});

const verifyMFA = z.object({
  body: z.object({
    tempToken: z.string({
      required_error: 'Temporary token is required',
    }),
    token: z
      .string({
        required_error: 'Verification code is required',
      })
      .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  }),
});

const verifyBackupCode = z.object({
  body: z.object({
    tempToken: z.string({
      required_error: 'Temporary token is required',
    }),
    backupCode: z
      .string({
        required_error: 'Backup code is required',
      })
      .min(12, 'Backup code must be at least 12 characters'),
  }),
});

const disableMFA = z.object({
  body: z.object({
    token: z
      .string({
        required_error: 'Verification code is required',
      })
      .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  }),
});

const regenerateBackupCodes = z.object({
  body: z.object({
    token: z
      .string({
        required_error: 'Verification code is required',
      })
      .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  }),
});

export const mfaValidation = {
  verifySetup,
  verifyMFA,
  verifyBackupCode,
  disableMFA,
  regenerateBackupCodes,
};
