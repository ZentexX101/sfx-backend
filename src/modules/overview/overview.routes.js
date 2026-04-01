const express = require("express");
const dashboardController = require("./overview.controller");
// const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/",

  dashboardController.getOverviewCards,
);
router.get(
  "/review-volume",

  dashboardController.getReviewVolumeByWeek,
);
router.get(
  "/review-status-ratings",

  dashboardController.getReviewCharts,
);

router.get(
  "/review-category-ratings",
  dashboardController.getReviewCategoryRatings,
)


module.exports = router;
