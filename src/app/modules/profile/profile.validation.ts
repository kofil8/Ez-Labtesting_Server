import { z } from 'zod';

const updateProfile = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    bio: z.string().optional(),
    dateOfBirth: z.string().optional(), // Expecting ISO string or date string
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
