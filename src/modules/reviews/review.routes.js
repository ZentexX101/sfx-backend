const express = require("express");
const router = express.Router();
const reviewController = require("./review.controller");
const uploadReviewMedia = require("../../middlewares/uploadReviewMedia");
// const authMiddleware = require("../../middlewares/authMiddleware");

router.post("/request-otp", reviewController.requestReviewOtp);
router.post(
  "/create",
  uploadReviewMedia.array("media", 3),
  reviewController.createReview,
);
router.get("/combined", reviewController.getCombinedReviews);
router.get("/", reviewController.getAllReviews);
router.get("/archive", reviewController.getArchivedReviews);
router.get("/:id", reviewController.getReviewById);
router.patch(
  "/:id/reply",

  reviewController.replyToReview,
);
router.patch(
  "/:id/reply/edit",

  reviewController.editReviewReply,
);
router.delete(
  "/:id/reply",

  reviewController.deleteReviewReply,
);
router.patch("/:id/restore", reviewController.restoreReview);
router.delete("/:id/permanent", reviewController.permanentlyDeleteReview);
router.patch("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

module.exports = router;
