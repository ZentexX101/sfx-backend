const express = require("express");
const router = express.Router();
const videoReviewController = require("./videoReview.controller");
const uploadVideoReview = require("../../middlewares/uploadVideoReview");
const authMiddleware = require("../../middlewares/authMiddleware");

router.post(
  "/create",
  uploadVideoReview.single("video"),
  videoReviewController.createVideoReview,
);
router.get(
  "/",
  authMiddleware("admin"),
  videoReviewController.getAllVideoReviews,
);
router.get("/:id", videoReviewController.getVideoReviewById);
router.patch(
  "/:id",
  authMiddleware("admin"),
  videoReviewController.updateVideoReview,
);
router.delete(
  "/:id",
  authMiddleware("admin"),
  videoReviewController.deleteVideoReview,
);

module.exports = router;
