const catchAsync = require("../../utils/catchAsync");
const videoReviewService = require("./videoReview.service");
const AppError = require("../../errors/AppError");
const sendResponse = require("../../utils/sendResponse");
const cloudinary = require("../../config/cloudinary");
const { Readable } = require("stream");

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
  if (!req.file) {
    return next(new AppError(400, "Video file is required"));
  }

  const uploadResult = await uploadVideoToCloudinary(req.file);

  const videoReview = await videoReviewService.createVideoReview({
    ...req.body,
    video: uploadResult.secure_url,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Video review created successfully",
    data: videoReview,
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
    message: "Video review deleted successfully",
    data: null,
  });
});
