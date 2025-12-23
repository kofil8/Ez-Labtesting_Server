import { rootCertificates } from 'tls';
import { z } from 'zod';

const createUser = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6).max(100, 'Password must be at most 100 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    profileImage: z.string().url().optional(),
    bio: z.string().optional(),
    dateOfBirth: z.string().optional(),
    isVerified: z.boolean().default(false),
    role: z.enum(['ADMIN', 'CUSTOMER', 'LAB_PARTNER']).default('CUSTOMER'),
  }),
});

const updateUser = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6).max(100, 'Password must be at most 100 characters long').optional(),
    fistName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    profileImage: z.string().url().optional(),
    bio: z.string().optional(),
    dateOfBirth: z.string().optional(),
    role: z.enum(['ADMIN', 'CUSTOMER', 'LAB_PARTNER']).optional(),
  }),
});

export const UserValidation = {
  createUser,
  updateUser,
};
