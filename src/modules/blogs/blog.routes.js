const express = require("express");
const router = express.Router();
const blogController = require("./blog.controller");
const uploadBlogMedia = require("../../middlewares/uploadBlogMedia");
const authMiddleware = require("../../middlewares/authMiddleware");

router.post(
  "/create",
  authMiddleware("admin"),
  uploadBlogMedia.fields([
    { name: "headerImage", maxCount: 1 },
    { name: "cardImage", maxCount: 1 },
    { name: "authorImage", maxCount: 1 },
  ]),
  blogController.createBlog,
);

router.get("/", blogController.getAllBlogs);
router.get("/:identifier", blogController.getBlogByIdentifier);

router.patch(
  "/:id",
  authMiddleware("admin"),
  uploadBlogMedia.fields([
    { name: "headerImage", maxCount: 1 },
    { name: "cardImage", maxCount: 1 },
    { name: "authorImage", maxCount: 1 },
  ]),
  blogController.updateBlog,
);

router.delete("/:id", authMiddleware("admin"), blogController.deleteBlog);

module.exports = router;
