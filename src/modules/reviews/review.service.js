const Review = require("./review.model");
const VideoReview = require("../videoReviews/videoReview.model");

const createReview = async (reviewData) => {
  return Review.create(reviewData);
};

const buildFilters = (query, includeReviewDescription = true) => {
  const filters = {};
  const includeArchived = query.includeArchived === "true";
  const onlyArchived = query.onlyArchived === "true";

  if (onlyArchived) {
    filters.isArchived = true;
  } else if (!includeArchived) {
    filters.isArchived = { $ne: true };
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.country) {
    filters.country = query.country;
  }

  if (query.program) {
    filters.program = query.program;
  }

  if (query.email) {
    filters.email = query.email.toLowerCase();
  }

  if (query.minRating || query.maxRating) {
    filters.rating = {};
    if (query.minRating) {
      filters.rating.$gte = Number(query.minRating);
    }
    if (query.maxRating) {
      filters.rating.$lte = Number(query.maxRating);
    }
  }

  if (query.search) {
    const searchRules = [
      { reviewTitle: { $regex: query.search, $options: "i" } },
      { program: { $regex: query.search, $options: "i" } },
      { category: { $regex: query.search, $options: "i" } },
      { country: { $regex: query.search, $options: "i" } },
    ];

    if (includeReviewDescription) {
      searchRules.push({
        reviewDescription: { $regex: query.search, $options: "i" },
      });
    }

    filters.$or = searchRules;
  }

  return filters;
};

const getConsumedCountsAt = (prefixLength, videoTotal, reviewTotal) => {
  const paired = Math.min(videoTotal, reviewTotal);
  const pairedLength = paired * 2;

  if (prefixLength <= pairedLength) {
    return {
      video: Math.ceil(prefixLength / 2),
      review: Math.floor(prefixLength / 2),
    };
  }

  const overflow = prefixLength - pairedLength;

  if (videoTotal >= reviewTotal) {
    return {
      video: paired + overflow,
      review: paired,
    };
  }

  return {
    video: paired,
    review: paired + overflow,
  };
};

const getCombinedReviews = async (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const reviewFilters = buildFilters(query, true);
  const videoReviewFilters = buildFilters(query, false);

  const [
    reviewTotal,
    videoReviewTotal,
    reviewStatusStats,
    videoStatusStats,
    reviewRatingStats,
    videoRatingStats,
  ] = await Promise.all([
    Review.countDocuments(reviewFilters),
    VideoReview.countDocuments(videoReviewFilters),
    Review.aggregate([
      { $match: reviewFilters },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    VideoReview.aggregate([
      { $match: videoReviewFilters },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Review.aggregate([
      { $match: reviewFilters },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          sumRating: { $sum: "$rating" },
          minRating: { $min: "$rating" },
          maxRating: { $max: "$rating" },
        },
      },
    ]),
    VideoReview.aggregate([
      { $match: videoReviewFilters },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          sumRating: { $sum: "$rating" },
          minRating: { $min: "$rating" },
          maxRating: { $max: "$rating" },
        },
      },
    ]),
  ]);

  const total = reviewTotal + videoReviewTotal;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = Math.min(skip, total);
  const end = Math.min(skip + limit, total);

  const startCounts = getConsumedCountsAt(start, videoReviewTotal, reviewTotal);
  const endCounts = getConsumedCountsAt(end, videoReviewTotal, reviewTotal);

  const videoSkip = startCounts.video;
  const reviewSkip = startCounts.review;
  const videoTake = Math.max(endCounts.video - startCounts.video, 0);
  const reviewTake = Math.max(endCounts.review - startCounts.review, 0);

  const [videoItems, reviewItems] = await Promise.all([
    VideoReview.find(videoReviewFilters)
      .sort(sort)
      .skip(videoSkip)
      .limit(videoTake)
      .lean(),
    Review.find(reviewFilters)
      .sort(sort)
      .skip(reviewSkip)
      .limit(reviewTake)
      .lean(),
  ]);

  const pairedLength = Math.min(videoReviewTotal, reviewTotal) * 2;
  const data = [];
  let videoPointer = 0;
  let reviewPointer = 0;

  for (let index = start; index < end; index += 1) {
    const shouldPickVideo =
      index < pairedLength ? index % 2 === 0 : videoReviewTotal > reviewTotal;

    if (shouldPickVideo && videoPointer < videoItems.length) {
      data.push({
        ...videoItems[videoPointer],
        reviewType: "video-review",
      });
      videoPointer += 1;
      continue;
    }

    if (!shouldPickVideo && reviewPointer < reviewItems.length) {
      data.push({
        ...reviewItems[reviewPointer],
        reviewType: "review",
      });
      reviewPointer += 1;
      continue;
    }

    if (videoPointer < videoItems.length) {
      data.push({
        ...videoItems[videoPointer],
        reviewType: "video-review",
      });
      videoPointer += 1;
    } else if (reviewPointer < reviewItems.length) {
      data.push({
        ...reviewItems[reviewPointer],
        reviewType: "review",
      });
      reviewPointer += 1;
    }
  }

  const statusCounts = {};

  [...reviewStatusStats, ...videoStatusStats].forEach((item) => {
    const key = item._id || "unknown";
    statusCounts[key] = (statusCounts[key] || 0) + item.count;
  });

  const reviewRating = reviewRatingStats[0] || null;
  const videoRating = videoRatingStats[0] || null;
  const ratingCount = (reviewRating?.count || 0) + (videoRating?.count || 0);
  const ratingSum =
    (reviewRating?.sumRating || 0) + (videoRating?.sumRating || 0);

  const ratingSummary = {
    average: ratingCount ? Number((ratingSum / ratingCount).toFixed(2)) : 0,
    min: ratingCount
      ? Math.min(
          reviewRating?.minRating ?? Number.POSITIVE_INFINITY,
          videoRating?.minRating ?? Number.POSITIVE_INFINITY,
        )
      : null,
    max: ratingCount
      ? Math.max(
          reviewRating?.maxRating ?? Number.NEGATIVE_INFINITY,
          videoRating?.maxRating ?? Number.NEGATIVE_INFINITY,
        )
      : null,
  };

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      sortBy,
      sortOrder: sortOrder === 1 ? "asc" : "desc",
      appliedFilters: {
        status: query.status || null,
        category: query.category || null,
        country: query.country || null,
        program: query.program || null,
        email: query.email || null,
        minRating: query.minRating || null,
        maxRating: query.maxRating || null,
        search: query.search || null,
      },
      summary: {
        statusCounts,
        rating: ratingSummary,
        reviewTypeCounts: {
          reviews: reviewTotal,
          videoReviews: videoReviewTotal,
        },
      },
    },
    data,
  };
};

const getAllReviews = async (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filters = {};
  const includeArchived = query.includeArchived === "true";
  const onlyArchived = query.onlyArchived === "true";

  if (onlyArchived) {
    filters.isArchived = true;
  } else if (!includeArchived) {
    // Keep old documents (without isArchived field) visible in active lists.
    filters.isArchived = { $ne: true };
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.country) {
    filters.country = query.country;
  }

  if (query.program) {
    filters.program = query.program;
  }

  if (query.email) {
    filters.email = query.email.toLowerCase();
  }

  if (query.minRating || query.maxRating) {
    filters.rating = {};
    if (query.minRating) {
      filters.rating.$gte = Number(query.minRating);
    }
    if (query.maxRating) {
      filters.rating.$lte = Number(query.maxRating);
    }
  }

  if (query.search) {
    filters.$or = [
      { reviewTitle: { $regex: query.search, $options: "i" } },
      { reviewDescription: { $regex: query.search, $options: "i" } },
      { program: { $regex: query.search, $options: "i" } },
      { category: { $regex: query.search, $options: "i" } },
      { country: { $regex: query.search, $options: "i" } },
    ];
  }

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const [reviews, total, statusStats, ratingStats] = await Promise.all([
    Review.find(filters).sort(sort).skip(skip).limit(limit),
    Review.countDocuments(filters),
    Review.aggregate([
      { $match: filters },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Review.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          minRating: { $min: "$rating" },
          maxRating: { $max: "$rating" },
        },
      },
    ]),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;
  const statusCounts = statusStats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const ratingSummary = ratingStats[0]
    ? {
        average: Number(ratingStats[0].averageRating?.toFixed(2) || 0),
        min: ratingStats[0].minRating,
        max: ratingStats[0].maxRating,
      }
    : {
        average: 0,
        min: null,
        max: null,
      };

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      sortBy,
      sortOrder: sortOrder === 1 ? "asc" : "desc",
      appliedFilters: {
        status: query.status || null,
        category: query.category || null,
        country: query.country || null,
        program: query.program || null,
        email: query.email || null,
        minRating: query.minRating || null,
        maxRating: query.maxRating || null,
        search: query.search || null,
      },
      summary: {
        statusCounts,
        rating: ratingSummary,
      },
    },
    data: reviews,
  };
};

const getReviewById = async (id) => {
  return Review.findById(id);
};

const updateReview = async (id, updateData) => {
  return Review.findOneAndUpdate(
    { _id: id, isArchived: { $ne: true } },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );
};

const deleteReview = async (id) => {
  return Review.findOneAndUpdate(
    { _id: id, isArchived: { $ne: true } },
    {
      isArchived: true,
      archivedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

const getArchivedReviews = async (query) => {
  return getAllReviews({ ...query, onlyArchived: "true" });
};

const restoreReview = async (id) => {
  return Review.findOneAndUpdate(
    { _id: id, isArchived: true },
    {
      isArchived: false,
      archivedAt: null,
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

const permanentlyDeleteReview = async (id) => {
  return Review.findOneAndDelete({ _id: id, isArchived: true });
};

const replyToReview = async (id, message, adminId) => {
  return Review.findOneAndUpdate(
    { _id: id, isArchived: { $ne: true } },
    {
      adminReply: {
        message,
        repliedBy: adminId,
        repliedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

const editReviewReply = async (id, message, adminId) => {
  return Review.findOneAndUpdate(
    { _id: id, isArchived: { $ne: true } },
    {
      adminReply: {
        message,
        repliedBy: adminId,
        repliedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

const deleteReviewReply = async (id) => {
  return Review.findOneAndUpdate(
    { _id: id, isArchived: { $ne: true } },
    {
      $unset: {
        adminReply: 1,
      },
    },
    {
      new: true,
    },
  );
};

module.exports = {
  createReview,
  getAllReviews,
  getCombinedReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getArchivedReviews,
  restoreReview,
  permanentlyDeleteReview,
  replyToReview,
  editReviewReply,
  deleteReviewReply,
};
