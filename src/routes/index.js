const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const reviewRoutes = require("../modules/reviews/review.routes");
const videoReviewRoutes = require("../modules/videoReviews/videoReview.routes");

const moduleRoutes = [
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/reviews",
    route: reviewRoutes,
  },
  {
    path: "/video-reviews",
    route: videoReviewRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
