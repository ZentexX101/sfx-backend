const catchAsync = require("../../utils/catchAsync");
const sendResponse = require("../../utils/sendResponse");
const AppError = require("../../errors/AppError");
const authService = require("./auth.service");

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError(400, "Name, email, and password are required"));
  }

  const result = await authService.registerUser({ name, email, password });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(400, "Email and password are required"));
  }

  const result = await authService.loginUser({ email, password });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: result,
  });
});
