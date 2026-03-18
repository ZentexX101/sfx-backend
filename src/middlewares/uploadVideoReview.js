const multer = require("multer");
const AppError = require("../errors/AppError");

const storage = multer.memoryStorage();

const allowedVideoMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

const fileFilter = (req, file, cb) => {
  if (allowedVideoMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new AppError(400, "Only MP4, WEBM, MOV, and MKV video files are allowed"),
  );
};

const uploadVideoReview = multer({
  storage,
  fileFilter,
  limits: {
    files: 1,
    fileSize: 100 * 1024 * 1024,
  },
});

module.exports = uploadVideoReview;
