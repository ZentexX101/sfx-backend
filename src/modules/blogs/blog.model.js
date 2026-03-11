const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    headerImage: {
      type: String,
      required: true,
      trim: true,
    },
    cardImage: {
      type: String,
      required: true,
      trim: true,
    },
    authorImage: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    publishedAt: {
      type: Date,
    },
    author: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      designation: {
        type: String,
        trim: true,
      },
      socialLinks: {
        facebook: {
          type: String,
          trim: true,
        },
        linkedin: {
          type: String,
          trim: true,
        },
        twitter: {
          type: String,
          trim: true,
        },
      },
    },
    seo: {
      metaTitle: {
        type: String,
        trim: true,
      },
      canonicalUrl: {
        type: String,
        trim: true,
      },
      metaDescription: {
        type: String,
        trim: true,
      },
      openGraphTags: [
        {
          type: String,
          trim: true,
        },
      ],
      schema: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
        optional: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

blogSchema.index({ status: 1, category: 1, publishedAt: -1, createdAt: -1 });

blogSchema.pre("save", function (next) {
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
