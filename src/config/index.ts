import dotenv from 'dotenv';
import path from 'path';
import { env } from './env';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  database_url: env.DATABASE_URL,
  redis_url: env.REDIS_URL,
  env: env.NODE_ENV,
  frontend_url: env.FRONTEND_URL,
  backend_file_url: env.BACKEND_FILE_URL,
  backend_base_url: env.BACKEND_BASE_URL,
  super_admin_first_name: process.env.SUPER_ADMIN_FIRST_NAME as string,
  super_admin_last_name: process.env.SUPER_ADMIN_LAST_NAME as string,
  super_admin_gender: process.env.SUPER_ADMIN_GENDER as string,
  super_admin_role: process.env.SUPER_ADMIN_ROLE as string,
  super_admin_email: process.env.SUPER_ADMIN_EMAIL as string,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD as string,
  super_admin_phone: process.env.SUPER_ADMIN_PHONE as string,
  super_admin_is_verified: process.env.IS_VERIFIED === 'true',
  port: env.PORT,
  salt: process.env.SALT || 12,

  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: env.AWS_S3_BUCKET_NAME,
  },

  jwt: {
    jwt_secret: env.JWT_SECRET,
    expires_in: env.EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
    refresh_token_secret: env.REFRESH_TOKEN_SECRET,
    refresh_token_expires_in: env.REFRESH_TOKEN_EXPIRES_IN as `${number}${
      | 's'
      | 'm'
      | 'h'
      | 'd'}`,
  },

  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.EMAIL_PASSWORD,
  },
};
