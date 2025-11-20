import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  database_url: process.env.DATABASE_URL,
  redis_url: process.env.REDIS_URL,
  env: process.env.NODE_ENV,
  frontend_url: process.env.FRONTEND_URL,
  backend_file_url: process.env.BACKEND_FILE_URL,
  backend_base_url: process.env.BACKEND_BASE_URL,
  super_admin_first_name: process.env.SUPER_ADMIN_FIRST_NAME as string,
  super_admin_last_name: process.env.SUPER_ADMIN_LAST_NAME as string,
  super_admin_email: process.env.SUPER_ADMIN_EMAIL as string,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD as string,
  super_admin_phone: process.env.SUPER_ADMIN_PHONE as string,
  port: process.env.PORT || 9001,
  salt: process.env.SALT || 12,

  jwt: {
    jwt_secret: process.env.JWT_SECRET!,
    expires_in: process.env.EXPIRES_IN! as `${number}${'s' | 'm' | 'h' | 'd'}`,
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET!,
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN! as `${number}${
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
