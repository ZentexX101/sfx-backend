const { StatusCodes } = require("http-status-codes");

const globalErrorHandler = (err, req, res, next) => {
	let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
	let message = err.message || "Internal Server Error";
	let description = err.description || "An unexpected error occurred. Please try again later."; // Use description from AppError
	let errors = {};

	// 🔹 Handle Mongoose Validation Errors (e.g., required fields)
	if (err.name === "ValidationError") {
		statusCode = StatusCodes.BAD_REQUEST;
		message = "Validation Error";
		description =
			"One or more required fields are invalid or missing. Please check the request body.";
		errors = Object.keys(err.errors).reduce((acc, key) => {
			acc[key] = err.errors[key].message;
			return acc;
		}, {});
	}

	// 🔹 Handle Mongoose Duplicate Key Error (MongoDB E11000 error)
	if (err.code === 11000) {
		statusCode = StatusCodes.BAD_REQUEST;
		message = "Duplicate Key Error";
		description = `The value you are trying to insert already exists. Please ensure uniqueness for the field(s) '${Object.keys(
			err.keyValue
		).join(", ")}'.`;
		errors = Object.keys(err.keyValue).reduce((acc, key) => {
			acc[key] = `${key} must be unique. '${err.keyValue[key]}' already exists.`;
			return acc;
		}, {});
	}

	// 🔹 Handle Mongoose CastErrors (Invalid ObjectId)
	if (err.name === "CastError") {
		statusCode = StatusCodes.BAD_REQUEST;
		message = `Invalid ${err.path}: ${err.value}`;
		description = `The provided ${err.path} value is not valid. Please check the format of ${err.path}.`;
		errors[err.path] = `Invalid ${err.path}: ${err.value}`;
	}

	// 🔹 Handle Mongoose Connection Errors (e.g., network issues)
	if (err.name === "MongoNetworkError" || err.name === "MongooseServerSelectionError") {
		statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
		message = "Database Connection Error";
		description =
			"There was an issue connecting to the database. Please check the network or server status.";
	}

	// 🔹 Handle Mongoose Timeout Errors (Database Timeout)
	if (err.name === "MongoTimeoutError") {
		statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
		message = "Database Timeout Error";
		description = "The database request timed out. Please try again later.";
	}

	// 🔹 Handle Other Mongoose Errors (Uncategorized MongoDB Errors)
	if (err.name === "MongoError") {
		statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
		message = "Database Error";
		description = "An unknown database error occurred. Please check the logs for more details.";
	}

	res.status(statusCode).json({
		success: false,
		message,
		error: {
			code: statusCode,
			description: err._message || description || "Something went wrong on the server.",
			details: Object.keys(errors).length ? errors : undefined, // Include specific errors if present
		},
	});
};

module.exports = globalErrorHandler;
