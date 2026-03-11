const Review = require("../reviews/review.model");
const VideoReview = require("../videoReviews/videoReview.model");

const getOverviewCards = async () => {
  const [
    totalTextReviews,
    totalVideoReviews,
    pendingTextReviews,
    pendingVideoReviews,
    rejectedTextReviews,
    rejectedVideoReviews,
    textRatingAgg,
    videoRatingAgg,
  ] = await Promise.all([
    Review.countDocuments({ isArchived: { $ne: true } }),
    VideoReview.countDocuments({ isArchived: { $ne: true } }),
    Review.countDocuments({ status: "pending", isArchived: { $ne: true } }),
    VideoReview.countDocuments({
      status: "pending",
      isArchived: { $ne: true },
    }),
    Review.countDocuments({ status: "rejected", isArchived: { $ne: true } }),
    VideoReview.countDocuments({
      status: "rejected",
      isArchived: { $ne: true },
    }),
    Review.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } },
    ]),
    VideoReview.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } },
    ]),
  ]);

  const totalReviews = totalTextReviews + totalVideoReviews;
  const pendingReviews = pendingTextReviews + pendingVideoReviews;
  const rejectedReviews = rejectedTextReviews + rejectedVideoReviews;

  const textAverageRating = textRatingAgg[0]?.averageRating || 0;
  const videoAverageRating = videoRatingAgg[0]?.averageRating || 0;

  const averageRating =
    totalReviews > 0
      ? Number(
          (
            (textAverageRating * totalTextReviews +
              videoAverageRating * totalVideoReviews) /
            totalReviews
          ).toFixed(2),
        )
      : 0;

  const rejectionRate =
    totalReviews > 0
      ? Number(((rejectedReviews / totalReviews) * 100).toFixed(2))
      : 0;

  return {
    totalReviews,
    averageRating,
    pendingReviews,
    rejectionRate,
    breakdown: {
      textReviews: totalTextReviews,
      videoReviews: totalVideoReviews,
    },
  };
};

const getDailyCounts = async (model, startDate, endDate) => {
  const result = await model.aggregate([
    {
      $match: {
        isArchived: { $ne: true },
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $project: {
        day: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
      },
    },
    {
      $group: {
        _id: "$day",
        count: { $sum: 1 },
      },
    },
  ]);

  return result.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

const getReviewVolumeByWeek = async (query) => {
  const weeks = Math.min(Math.max(parseInt(query.weeks, 10) || 4, 1), 12);
  const totalDays = weeks * 7;

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (totalDays - 1));

  const [textDailyMap, videoDailyMap] = await Promise.all([
    getDailyCounts(Review, startDate, endDate),
    getDailyCounts(VideoReview, startDate, endDate),
  ]);

  const weeklyVolume = [];

  for (let index = 0; index < weeks; index += 1) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + index * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    let textCount = 0;
    let videoCount = 0;

    for (let day = 0; day < 7; day += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + day);
      const key = date.toISOString().slice(0, 10);

      textCount += textDailyMap[key] || 0;
      videoCount += videoDailyMap[key] || 0;
    }

    weeklyVolume.push({
      label: `Week ${index + 1}`,
      startDate: weekStart.toISOString().slice(0, 10),
      endDate: weekEnd.toISOString().slice(0, 10),
      totalReviews: textCount + videoCount,
      textReviews: textCount,
      videoReviews: videoCount,
    });
  }

  return {
    range: {
      weeks,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    },
    weeklyVolume,
  };
};

const getRatingCountsByBucket = async (model) => {
  const bucketResult = await model.aggregate([
    {
      $match: {
        isArchived: { $ne: true },
      },
    },
    {
      $bucket: {
        groupBy: "$rating",
        boundaries: [0, 1.5, 2.5, 3.5, 4.5, 6],
        default: "other",
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ]);

  const mapping = {
    0: 1,
    1.5: 2,
    2.5: 3,
    3.5: 4,
    4.5: 5,
  };

  return bucketResult.reduce(
    (acc, item) => {
      const star = mapping[item._id];
      if (star) {
        acc[star] += item.count;
      }
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  );
};

const getReviewCharts = async () => {
  const [textStarCounts, videoStarCounts] = await Promise.all([
    getRatingCountsByBucket(Review),
    getRatingCountsByBucket(VideoReview),
  ]);

  const starCounts = {
    1: textStarCounts[1] + videoStarCounts[1],
    2: textStarCounts[2] + videoStarCounts[2],
    3: textStarCounts[3] + videoStarCounts[3],
    4: textStarCounts[4] + videoStarCounts[4],
    5: textStarCounts[5] + videoStarCounts[5],
  };

  const totalReviews =
    starCounts[1] +
    starCounts[2] +
    starCounts[3] +
    starCounts[4] +
    starCounts[5];

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: starCounts[star],
    percentage:
      totalReviews > 0
        ? Number(((starCounts[star] / totalReviews) * 100).toFixed(2))
        : 0,
  }));

  const positive = starCounts[4] + starCounts[5];
  const neutral = starCounts[3];
  const negative = starCounts[1] + starCounts[2];

  const reviewStatus = {
    positive: {
      count: positive,
      percentage:
        totalReviews > 0
          ? Number(((positive / totalReviews) * 100).toFixed(2))
          : 0,
    },
    neutral: {
      count: neutral,
      percentage:
        totalReviews > 0
          ? Number(((neutral / totalReviews) * 100).toFixed(2))
          : 0,
    },
    negative: {
      count: negative,
      percentage:
        totalReviews > 0
          ? Number(((negative / totalReviews) * 100).toFixed(2))
          : 0,
    },
  };

  return {
    totalReviews,
    ratingDistribution,
    reviewStatus,
  };
};

module.exports = {
  getOverviewCards,
  getReviewVolumeByWeek,
  getReviewCharts,
};
