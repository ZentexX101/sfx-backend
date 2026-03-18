const multer = require("multer");
const AppError = require("../errors/AppError");

const storage = multer.memoryStorage();

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(new AppError(400, "Only JPG, PNG, and WEBP images are allowed"));
};

const uploadBlogMedia = multer({
  storage,
  fileFilter,
  limits: {
    files: 3,
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = uploadBlogMedia;
