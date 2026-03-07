class AppError extends Error {
	constructor(
		statusCode,
		message,
		description = "An unexpected error occurred. Please try again later.",
		stack = ""
	) {
		super(message);
		this.statusCode = statusCode;
		this.message = message;
		this.description = description; // Add description here

		if (stack) {
			this.stack = stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

module.exports = AppError;
