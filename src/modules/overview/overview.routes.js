const express = require("express");
const dashboardController = require("./overview.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware("admin"),
  dashboardController.getOverviewCards,
);
router.get(
  "/review-volume",
  authMiddleware("admin"),
  dashboardController.getReviewVolumeByWeek,
);
router.get(
  "/review-status-ratings",
  authMiddleware("admin"),
  dashboardController.getReviewCharts,
);

module.exports = router;
