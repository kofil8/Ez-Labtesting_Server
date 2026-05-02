import z from 'zod';
import { Gender } from '@prisma/client';

const register = z.object({
  body: z.object({
    firstName: z.string({
      required_error: 'First name is required!',
    }),
    lastName: z.string({
      required_error: 'Last name is required!',
    }),
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email('Invalid email format!'),
    phoneNumber: z
      .string({
        required_error: 'Phone number is required!',
      })
      .min(10, 'Phone number must be at least 10 digits'),
    password: z
      .string({
        required_error: 'Password is required!',
      })
      .min(8, 'Password must be at least 8 characters long!')
      .regex(
        /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()])/,
        'Password must contain at least one uppercase letter, one number and one special character!',
      ),
    // Optional medical fields
    gender: z.nativeEnum(Gender).optional(),
    dateOfBirth: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }),
});

const resendOTP = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
  }),
});

const verifyOTP = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
    otp: z
      .string({
        required_error: 'OTP is required!',
      })
      .regex(/^\d{6}$/, 'OTP must be 6 digits'),
  }),
});

const loginUser = z.object({
  body: z
    .object({
      email: z
        .string({
          required_error: 'Email is required!',
        })
        .email({
          message: 'Invalid email format!',
        })
        .optional(),
      phoneNumber: z
        .string({
          required_error: 'Phone number is required!',
        })
        .min(10, 'Phone number must be at least 10 digits')
        .optional(),
      password: z.string({
        required_error: 'Password is required!',
      }),
      pushToken: z.string().nullable().optional(),
      platform: z.string().optional().default('web'),
    })
    .refine((data) => data.email || data.phoneNumber, {
      message: 'Either email or phone number must be provided',
      path: ['email'],
    }),
});

const logoutUser = z.object({
  body: z.object({}),
});

const forgotPassword = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  }),
});

const resetPassword = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()])/,
        'Password must contain at least one uppercase letter, one number and one special character',
      ),
  }),
});

export const authValidation = {
  register,
  resendOTP,
  verifyOTP,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
};
