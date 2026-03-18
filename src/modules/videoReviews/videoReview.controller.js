const catchAsync = require("../../utils/catchAsync");
const videoReviewService = require("./videoReview.service");
const AppError = require("../../errors/AppError");
const sendResponse = require("../../utils/sendResponse");
const cloudinary = require("../../config/cloudinary");
const { Readable } = require("stream");
const reviewOtpService = require("../reviewOtp/reviewOtp.service");

const uploadVideoToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "sfx-video-reviews",
        resource_type: "video",
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

exports.createVideoReview = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(
      new AppError(400, "Email and OTP are required to submit video review"),
    );
  }

  await reviewOtpService.verifyOtp(email, otp, "video-review");

  const payload = { ...req.body };
  delete payload.otp;

  if (!req.file) {
    return next(new AppError(400, "Video file is required"));
  }

  const uploadResult = await uploadVideoToCloudinary(req.file);

  const videoReview = await videoReviewService.createVideoReview({
    ...payload,
    video: uploadResult.secure_url,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Video review created successfully",
    data: videoReview,
  });
});

exports.requestVideoReviewOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError(400, "Email is required"));
  }

  const result = await reviewOtpService.requestOtp(email, "video-review");

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP sent successfully to email",
    data: result,
  });
});

exports.getAllVideoReviews = catchAsync(async (req, res, next) => {
  const result = await videoReviewService.getAllVideoReviews(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Video reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

exports.getArchivedVideoReviews = catchAsync(async (req, res, next) => {
  const result = await videoReviewService.getArchivedVideoReviews(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Archived video reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

exports.getVideoReviewById = catchAsync(async (req, res, next) => {
  const videoReview = await videoReviewService.getVideoReviewById(
    req.params.id,
  );

  if (!videoReview) {
    return next(new AppError(404, "Video review not found"));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Video review retrieved successfully",
    data: videoReview,
  });
});

exports.updateVideoReview = catchAsync(async (req, res, next) => {
  const videoReview = await videoReviewService.updateVideoReview(
    req.params.id,
    req.body,
  );

  if (!videoReview) {
    return next(new AppError(404, "Video review not found"));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Video review updated successfully",
    data: videoReview,
  });
});

exports.deleteVideoReview = catchAsync(async (req, res, next) => {
  const videoReview = await videoReviewService.deleteVideoReview(req.params.id);

  if (!videoReview) {
    return next(new AppError(404, "Video review not found"));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Video review archived successfully",
    data: null,
  });
});

exports.restoreVideoReview = catchAsync(async (req, res, next) => {
  const videoReview = await videoReviewService.restoreVideoReview(
    req.params.id,
  );

  if (!videoReview) {
    return next(new AppError(404, "Archived video review not found"));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Video review restored successfully",
    data: videoReview,
  });
});

exports.permanentlyDeleteVideoReview = catchAsync(async (req, res, next) => {
  const videoReview = await videoReviewService.permanentlyDeleteVideoReview(
    req.params.id,
  );

  if (!videoReview) {
    return next(new AppError(404, "Archived video review not found"));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Video review permanently deleted successfully",
    data: null,
  });
});

exports.replyToVideoReview = catchAsync(async (req, res, next) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return next(new AppError(400, "Reply message is required"));
  }

  const videoReview = await videoReviewService.replyToVideoReview(
    req.params.id,
    message.trim(),
    req.user?._id,
  );

  if (!videoReview) {
    return next(new AppError(404, "Video review not found"));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reply added successfully",
    data: videoReview,
  });
});

exports.editVideoReviewReply = catchAsync(async (req, res, next) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return next(new AppError(400, "Reply message is required"));
  }

  const existingReview = await videoReviewService.getVideoReviewById(
    req.params.id,
  );
  if (!existingReview) {
    return next(new AppError(404, "Video review not found"));
  }

  if (!existingReview.adminReply?.message) {
    return next(new AppError(404, "Reply not found"));
  }

  const videoReview = await videoReviewService.editVideoReviewReply(
    req.params.id,
    message.trim(),
    req.user?._id,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reply updated successfully",
    data: videoReview,
  });
});

exports.deleteVideoReviewReply = catchAsync(async (req, res, next) => {
  const existingReview = await videoReviewService.getVideoReviewById(
    req.params.id,
  );
  if (!existingReview) {
    return next(new AppError(404, "Video review not found"));
  }

  if (!existingReview.adminReply?.message) {
    return next(new AppError(404, "Reply not found"));
  }

  const videoReview = await videoReviewService.deleteVideoReviewReply(
    req.params.id,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reply deleted successfully",
    data: videoReview,
  });
});
