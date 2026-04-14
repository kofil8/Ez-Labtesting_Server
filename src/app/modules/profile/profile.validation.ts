import { Gender } from '@prisma/client';
import { z } from 'zod';

const updateProfileBodyData = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

const updateProfile = z.object({
  body: z.object({
    bodyData: updateProfileBodyData.optional(),
  }),
});

const changePassword = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const ProfileValidation = {
  updateProfile,
  changePassword,
};
