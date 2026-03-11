const VideoReview = require("./videoReview.model");

const createVideoReview = async (reviewData) => {
  return VideoReview.create(reviewData);
};

const getAllVideoReviews = async (query) => {
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
      { program: { $regex: query.search, $options: "i" } },
      { category: { $regex: query.search, $options: "i" } },
      { country: { $regex: query.search, $options: "i" } },
    ];
  }

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const [reviews, total, statusStats, ratingStats] = await Promise.all([
    VideoReview.find(filters).sort(sort).skip(skip).limit(limit),
    VideoReview.countDocuments(filters),
    VideoReview.aggregate([
      { $match: filters },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    VideoReview.aggregate([
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

const getVideoReviewById = async (id) => {
  return VideoReview.findById(id);
};

const updateVideoReview = async (id, updateData) => {
  return VideoReview.findOneAndUpdate(
    { _id: id, isArchived: { $ne: true } },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );
};

const deleteVideoReview = async (id) => {
  return VideoReview.findOneAndUpdate(
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

const getArchivedVideoReviews = async (query) => {
  return getAllVideoReviews({ ...query, onlyArchived: "true" });
};

const restoreVideoReview = async (id) => {
  return VideoReview.findOneAndUpdate(
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

const permanentlyDeleteVideoReview = async (id) => {
  return VideoReview.findOneAndDelete({ _id: id, isArchived: true });
};

const replyToVideoReview = async (id, message, adminId) => {
  return VideoReview.findOneAndUpdate(
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

const editVideoReviewReply = async (id, message, adminId) => {
  return VideoReview.findOneAndUpdate(
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

const deleteVideoReviewReply = async (id) => {
  return VideoReview.findOneAndUpdate(
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
  createVideoReview,
  getAllVideoReviews,
  getVideoReviewById,
  updateVideoReview,
  deleteVideoReview,
  getArchivedVideoReviews,
  restoreVideoReview,
  permanentlyDeleteVideoReview,
  replyToVideoReview,
  editVideoReviewReply,
  deleteVideoReviewReply,
};
