import { z } from 'zod';

const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']),
  }),
});

const updateAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
    isActive: z.boolean().optional(),
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
