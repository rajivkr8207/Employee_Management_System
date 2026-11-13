import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const Config = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  mongodb_uri: process.env.MONGODB_URI,
  Node_ENV: process.env.NODE_ENV,
  // JWT
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,

  // Redis (optional)
  redis_host: process.env.REDIS_HOST,
  redis_port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  redis_password: process.env.REDIS_PASSWORD,

  // SMTP (optional)
  smtp_host: process.env.SMTP_HOST,
  smtp_user: process.env.SMTP_USER,
  smtp_pass: process.env.SMTP_PASS,

  frontend_url: process.env.FRONTEND_URL,
  backendUrl: process.env.BACKEND_URL,

  IMAGE_KIT: process.env.IMAGE_KIT,

  // Initial Admin Bootstrap (Used when no admin exists in database)
  initial_admin_email:
    process.env.INITIAL_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@ems.com',
  initial_admin_password:
    process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@123456',
  initial_admin_username:
    process.env.INITIAL_ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'superadmin',
  initial_admin_name: process.env.INITIAL_ADMIN_NAME || 'System Administrator',
};

export default Config;
