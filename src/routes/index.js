const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const blogRoutes = require("../modules/blogs/blog.routes");
const reviewRoutes = require("../modules/reviews/review.routes");
const videoReviewRoutes = require("../modules/videoReviews/videoReview.routes");
const dashboardRoutes = require("../modules/overview/overview.routes");

const moduleRoutes = [
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/blogs",
    route: blogRoutes,
  },
  {
    path: "/reviews",
    route: reviewRoutes,
  },
  {
    path: "/video-reviews",
    route: videoReviewRoutes,
  },
  {
    path: "/overview",
    route: dashboardRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
