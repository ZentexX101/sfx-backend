/* eslint-disable no-undef */
require("dotenv").config();

const config = {
  environment: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  jwt_access_secret: process.env.JWT_SECRET_KEY,
  admin_email: process.env.ADMIN_EMAIL,
  smtp_host: process.env.SMTP_HOST,
  smtp_port: process.env.SMTP_PORT,
  smtp_user: process.env.SMTP_USER,
  smtp_pass: process.env.SMTP_PASS,
  smtp_from: process.env.SMTP_FROM,
  otp_expires_minutes: process.env.OTP_EXPIRES_MINUTES,
  cloudinary_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_secret_key: process.env.CLOUDINARY_SECRET_KEY,
};

module.exports = config;
