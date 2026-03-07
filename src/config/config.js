/* eslint-disable no-undef */
require("dotenv").config();

const config = {
  environment: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  jwt_access_secret: process.env.JWT_SECRET_KEY,
  admin_email: process.env.ADMIN_EMAIL,
  cloudinary_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_secret_key: process.env.CLOUDINARY_SECRET_KEY,
};

module.exports = config;
