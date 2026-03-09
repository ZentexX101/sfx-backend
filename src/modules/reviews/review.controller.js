const catchAsync = require("../../utils/catchAsync");
const reviewService = require("./review.service");
const AppError = require("../../errors/AppError");
const sendResponse = require("../../utils/sendResponse");
const cloudinary = require("../../config/cloudinary");
const { Readable } = require("stream");
const reviewOtpService = require("../reviewOtp/reviewOtp.service");

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "sfx-reviews",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      },
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

exports.createReview = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(
      new AppError(400, "Email and OTP are required to submit review"),
    );
  }

  await reviewOtpService.verifyOtp(email, otp, "review");

  const payload = { ...req.body };
  delete payload.otp;

  let media = [];

  if (req.files?.length) {
    const uploadResults = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file)),
    );
    media = uploadResults.map((item) => item.secure_url);
  }

  const review = await reviewService.createReview({
    ...payload,
    media,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: review,
  });
});

exports.requestReviewOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError(400, "Email is required"));
  }

  const result = await reviewOtpService.requestOtp(email, "review");

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP sent successfully to email",
    data: result,
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const result = await reviewService.getAllReviews(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

exports.getReviewById = catchAsync(async (req, res, next) => {
  const review = await reviewService.getReviewById(req.params.id);
  if (!review) {
    return next(new AppError(404, "Review not found"));
  }
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review retrieved successfully",
    data: review,
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await reviewService.updateReview(req.params.id, req.body);
  if (!review) {
    return next(new AppError(404, "Review not found"));
  }
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data: review,
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await reviewService.deleteReview(req.params.id);
  if (!review) {
    return next(new AppError(404, "Review not found"));
  }
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data: null,
  });
});

exports.replyToReview = catchAsync(async (req, res, next) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return next(new AppError(400, "Reply message is required"));
  }

  const review = await reviewService.replyToReview(
    req.params.id,
    message.trim(),
    req.user?._id,
  );

  if (!review) {
    return next(new AppError(404, "Review not found"));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reply added successfully",
    data: review,
  });
});

exports.editReviewReply = catchAsync(async (req, res, next) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return next(new AppError(400, "Reply message is required"));
  }

  const existingReview = await reviewService.getReviewById(req.params.id);
  if (!existingReview) {
    return next(new AppError(404, "Review not found"));
  }

  if (!existingReview.adminReply?.message) {
    return next(new AppError(404, "Reply not found"));
  }

  const review = await reviewService.editReviewReply(
    req.params.id,
    message.trim(),
    req.user?._id,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reply updated successfully",
    data: review,
  });
});

exports.deleteReviewReply = catchAsync(async (req, res, next) => {
  const existingReview = await reviewService.getReviewById(req.params.id);
  if (!existingReview) {
    return next(new AppError(404, "Review not found"));
  }

  if (!existingReview.adminReply?.message) {
    return next(new AppError(404, "Reply not found"));
  }

  const review = await reviewService.deleteReviewReply(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reply deleted successfully",
    data: review,
  });
});
