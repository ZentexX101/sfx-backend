const catchAsync = require("../../utils/catchAsync");
const reviewService = require("./review.service");
const AppError = require("../../errors/AppError");
const sendResponse = require("../../utils/sendResponse");
const cloudinary = require("../../config/cloudinary");
const { Readable } = require("stream");

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
  let media = [];

  if (req.files?.length) {
    const uploadResults = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file)),
    );
    media = uploadResults.map((item) => item.secure_url);
  }

  const review = await reviewService.createReview({
    ...req.body,
    media,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: review,
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
