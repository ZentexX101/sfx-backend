const AppError = require("../errors/AppError");
const { StatusCodes } = require("http-status-codes");
const { verifyToken } = require("../utils/tokenUtils");

const authMiddleware = (...requiredRoles) => {
  return (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return next(new AppError(StatusCodes.UNAUTHORIZED, "No token provided"));
    }

    const tokenParts = token.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return next(
        new AppError(StatusCodes.UNAUTHORIZED, "Invalid token format"),
      );
    }

    const decoded = verifyToken(tokenParts[1]);

    if (!decoded) {
      return next(
        new AppError(StatusCodes.UNAUTHORIZED, "Failed to authenticate token"),
      );
    }

    if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
      return next(
        new AppError(
          StatusCodes.FORBIDDEN,
          "Access denied. Insufficient permissions.",
        ),
      );
    }

    req.user = decoded;
    next();
  };
};

module.exports = authMiddleware;
