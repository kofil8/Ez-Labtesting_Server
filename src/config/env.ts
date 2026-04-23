import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(7001),
  SERVER_URL: z.string().default('http://localhost:7001'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  EXPIRES_IN: z.string().default('15m'),
  AUTH_SESSION_DEBUG: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
  AWS_REGION: z.string().optional().default(''),
  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_S3_BUCKET_NAME: z.string().optional().default(''),

  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),

  // ACCESS Lab Integration
  // Backward compatible: ACCESS_API_URL is treated as base URL.
  ACCESS_API_URL: z.string().optional().default('https://access.labsvc.net'),
  ACCESS_BASE_URL: z.string().optional().default('https://access.labsvc.net'),
  ACCESS_ORDER_URL: z
    .string()
    .optional()
    .default('https://access.labsvc.net/orderAPI_landingPage.html'),
  ACCESS_USERNAME: z.string(),
  ACCESS_PASSWORD: z.string(),

  // Google Maps API
  GOOGLE_MAPS_API_KEY: z.string().optional().default(''),

  // SMTP Configuration (optional with defaults)
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.preprocess((v) => v === 'true' || v === true, z.boolean()).default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM_EMAIL: z.string().email().optional().default('noreply@ezlabtesting.com'),
  SMTP_FROM_NAME: z.string().optional().default('Ez Lab Testing'),
  OTP_IMAGE_URL: z.string().optional().default(''),

  // Client URL for emails and CORS
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Pricing / Fees
  PAYMENT_CURRENCY: z.string().default('usd'),
  PROCESSING_FEE_PERCENT: z.coerce.number().default(0),
  PROCESSING_FEE_FLAT: z.coerce.number().default(0),

  // Checkout session expiry
  CHECKOUT_SESSION_TTL_MIN: z.coerce.number().default(30),
  CHECKOUT_SESSION_CLEANUP_CRON: z.string().default('*/10 * * * *'),
  STALE_ORDER_TIMEOUT_MIN: z.coerce.number().default(60),
  STALE_ORDER_TIMEOUT_CRON: z.string().default('*/15 * * * *'),
  ACCESS_RESULTS_SYNC_CRON: z.string().default('0 */4 * * *'),
  REQUISITION_SIGNED_URL_TTL_SECONDS: z.coerce.number().default(300),
  ADMIN_REVIEW_EMAILS: z.string().optional().default(''),
  IP_GEOLOOKUP_URL_TEMPLATE: z.string().default('https://ipwho.is/{ip}'),
  IP_GEOLOOKUP_TIMEOUT_MS: z.coerce.number().default(3000),
  PUBLIC_IP_LOOKUP_URL_TEMPLATE: z.string().default('https://api.ipify.org?format=json'),
  PUBLIC_IP_LOOKUP_TIMEOUT_MS: z.coerce.number().default(3000),

  // Rate Limiting
  FCM_RATE_LIMIT: z.coerce.number().default(10000),
  EMAIL_RATE_LIMIT: z.coerce.number().default(100),

  // Socket.IO Reconnection Window (in minutes)
  SOCKET_RECONNECTION_WINDOW: z.coerce.number().default(5),
});

export const env = envSchema.parse(process.env);
