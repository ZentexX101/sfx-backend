const mongoose = require("mongoose");

const videoReviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewTitle: {
      type: String,
      required: true,
      trim: true,
    },
    program: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    experienceDate: {
      type: Date,
      required: true,
    },
    isPaidReview: {
      type: Boolean,
      default: false,
    },
    video: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    adminReply: {
      message: {
        type: String,
        trim: true,
      },
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      repliedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  },
);

const VideoReview = mongoose.model("VideoReview", videoReviewSchema);

module.exports = VideoReview;
