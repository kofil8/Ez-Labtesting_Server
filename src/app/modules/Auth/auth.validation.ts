import z from 'zod';

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
      .min(6, 'Password must be at least 6 characters long!')
      .regex(
        /^(?=.*[0-9])(?=.*[!@#$%^&*])/,
        'Password must contain at least one number and one special character!',
      ),
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
    otp: z.string({
      required_error: 'OTP is required!',
    }),
  }),
});

const loginUser = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
    password: z.string({
      required_error: 'Password is required!',
    }),
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
    otp: z.string().min(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
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
