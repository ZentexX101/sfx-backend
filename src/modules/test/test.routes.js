const express = require("express");
const { createTestHandler, getSingleTestHandler } = require("./test.controller");
const router = express.Router();

// Route to create a new blog
router.post("/create-test", createTestHandler);

// Router to get a single blog using id
router.get("/get-test/:id", getSingleTestHandler);

// Example: Allow only users with the "admin" or "user" role to access this route
// router.get("/get-blog/:id", authMiddleware("admin", "user"), getSingleBlogHandler);

module.exports = router;
