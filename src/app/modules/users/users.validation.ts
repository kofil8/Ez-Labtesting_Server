import { Gender } from '@prisma/client';
import { z } from 'zod';

const createUser = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6).max(100, 'Password must be at most 100 characters long'),
    username: z.string().min(3).max(30, 'Username must be between 3 and 30 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phoneNumber: z.string().optional(),
    profileImage: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    gender: z.nativeEnum(Gender).optional(),
    dateOfBirth: z.string().optional(),
    addressLine1: z.string().max(255).optional(),
    addressLine2: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zipCode: z.string().max(20).optional(),
    isVerified: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'DISABLED', 'BLOCKED']).optional(),
    role: z.enum(['ADMIN', 'CUSTOMER', 'LAB_PARTNER']).default('CUSTOMER'),
  }),
});

const updateUser = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6).max(100, 'Password must be at most 100 characters long').optional(),
    username: z
      .string()
      .min(3)
      .max(30, 'Username must be between 3 and 30 characters long')
      .optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    phoneNumber: z.string().optional(),
    profileImage: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    gender: z.nativeEnum(Gender).optional(),
    dateOfBirth: z.string().optional(),
    addressLine1: z.string().max(255).optional(),
    addressLine2: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zipCode: z.string().max(20).optional(),
    isVerified: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'DISABLED', 'BLOCKED']).optional(),
    role: z.enum(['ADMIN', 'CUSTOMER', 'LAB_PARTNER']).optional(),
  }),
});

export const UserValidation = {
  createUser,
  updateUser,
};
