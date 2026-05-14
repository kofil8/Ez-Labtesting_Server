import { z } from 'zod';

const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['ADMIN', 'LAB_PARTNER']),
  }),
});

const updateAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    phoneNumber: z.string().min(1, 'Phone number is required').optional(),
    role: z.enum(['ADMIN', 'LAB_PARTNER']).optional(),
    status: z.enum(['ACTIVE', 'DISABLED', 'BLOCKED']).optional(),
  }),
});

const updateSettingSchema = z.object({
  body: z.object({
    key: z.string().min(1, 'Setting key is required'),
    value: z.any(),
  }),
});

export const SuperAdminValidation = {
  createAdmin: createAdminSchema,
  updateAdmin: updateAdminSchema,
  updateSetting: updateSettingSchema,
};
