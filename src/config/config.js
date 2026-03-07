/* eslint-disable no-undef */
require("dotenv").config();

const config = {
	environment: process.env.NODE_ENV,
	port: process.env.PORT,
	database_url: process.env.DATABASE_URL,
	jwt_access_secret: process.env.JWT_SECRET_KEY,

};

module.exports = config;
