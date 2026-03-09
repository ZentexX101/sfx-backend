const express = require("express");
const router = express.Router();
const reviewController = require("./review.controller");
const uploadReviewMedia = require("../../middlewares/uploadReviewMedia");
const authMiddleware = require("../../middlewares/authMiddleware");

router.post("/request-otp", reviewController.requestReviewOtp);
router.post(
  "/create",
  uploadReviewMedia.array("media", 3),
  reviewController.createReview,
);
router.get("/", authMiddleware("admin"), reviewController.getAllReviews);
router.get("/:id", reviewController.getReviewById);
router.patch(
  "/:id/reply",
  authMiddleware("admin"),
  reviewController.replyToReview,
);
router.patch(
  "/:id/reply/edit",
  authMiddleware("admin"),
  reviewController.editReviewReply,
);
router.delete(
  "/:id/reply",
  authMiddleware("admin"),
  reviewController.deleteReviewReply,
);
router.patch("/:id", authMiddleware("admin"), reviewController.updateReview);
router.delete("/:id", authMiddleware("admin"), reviewController.deleteReview);

module.exports = router;
