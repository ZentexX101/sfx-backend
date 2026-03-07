const cloudinary = require("cloudinary").v2;
const config = require("./config");

cloudinary.config({
  cloud_name: config.cloudinary_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_secret_key,
});

module.exports = cloudinary;
