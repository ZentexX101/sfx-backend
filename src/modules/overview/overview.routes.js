const express = require("express");
const dashboardController = require("./overview.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/overview-cards",
  authMiddleware("admin"),
  dashboardController.getOverviewCards,
);
router.get(
  "/review-volume",
  authMiddleware("admin"),
  dashboardController.getReviewVolumeByWeek,
);
router.get(
  "/review-charts",
  authMiddleware("admin"),
  dashboardController.getReviewCharts,
);

module.exports = router;
