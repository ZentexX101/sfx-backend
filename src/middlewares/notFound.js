const { StatusCodes } = require("http-status-codes");

const notFoundErrorHandler = (req, res, next) => {
	res.status(StatusCodes.NOT_FOUND).json({
		success: false,
		message: `Route '${req.originalUrl}' not found for ${req.method} request`,
		error: {
			code: StatusCodes.NOT_FOUND,
			description: `The requested route '${req.originalUrl}' with method '${req.method}' does not exist on this server.`,
		},
	});
};

module.exports = notFoundErrorHandler;
