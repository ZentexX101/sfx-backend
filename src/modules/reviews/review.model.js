const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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

    reviewDescription: {
      type: String,
      required: true,
      trim: true,
    },

    program: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
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

    media: [
      {
        type: String, // image url
      },
    ],

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

reviewSchema.path("media").validate(function (value) {
  return !value || value.length <= 3;
}, "You can upload up to 3 images only");

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
