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
      required: false,
      trim: true,
    },
    mux: {
      uploadId: { type: String, trim: true },
      assetId: { type: String, trim: true },
      status: { type: String, trim: true },
      playbackIds: [
        {
          id: { type: String },
          policy: { type: String },
          _id: false,
        },
      ],
      createdAt: { type: Date },
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    archivedAt: {
      type: Date,
      default: null,
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
