import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(7001),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  EXPIRES_IN: z.string().default('15m'),
  AWS_REGION: z.string().optional().default(''),
  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_S3_BUCKET_NAME: z.string().optional().default(''),

  // SMTP Configuration (optional with defaults)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM_EMAIL: z.string().email().optional().default('noreply@ezlabtesting.com'),
  SMTP_FROM_NAME: z.string().optional().default('Ez Lab Testing'),

  // Client URL for emails and CORS
  CLIENT_URL: z.string().default('http://localhost:3000'),

  // Rate Limiting
  FCM_RATE_LIMIT: z.coerce.number().default(10000), // per minute
  EMAIL_RATE_LIMIT: z.coerce.number().default(100), // per minute

  // Socket.IO Reconnection Window (in minutes)
  SOCKET_RECONNECTION_WINDOW: z.coerce.number().default(5),
});

export const env = envSchema.parse(process.env);
