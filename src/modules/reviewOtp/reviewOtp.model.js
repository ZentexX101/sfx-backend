const mongoose = require("mongoose");

const reviewOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["review", "video-review"],
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reviewOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ReviewOtp = mongoose.model("ReviewOtp", reviewOtpSchema);

module.exports = ReviewOtp;
