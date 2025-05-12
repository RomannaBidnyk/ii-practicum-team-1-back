const {
  uploadImageMiddleware,
  deleteImageMiddleware,
} = require("./cloudinaryMiddleware");
const upload = require("./uploadMiddleware");
const multer = require("multer");
const { BadRequestError } = require("../errors");

const handleMulterErrors = (req, res, next) => {
  upload.array("image")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new BadRequestError("File too large. Max size is 5MB."));
      }
      return next(new BadRequestError(err.message));
    } else if (err) {
      return next(new BadRequestError(err.message));
    }
    next();
  });
};

const hasOneImage = (req, res, next) => {
  if (req.files && req.files.length > 1) {
    return next(new BadRequestError("Only one image is allowed."));
  }
  next();
};

// This guarantees the right order
const imageUploadPipeline = [handleMulterErrors, uploadImageMiddleware];
const singleImageUploadPipeline = [
  handleMulterErrors, // multer runs here
  hasOneImage, // then we check number of files
  uploadImageMiddleware,
];

const deleteImagePipeline = [deleteImageMiddleware];

module.exports = {
  imageUploadPipeline,
  deleteImagePipeline,
  singleImageUploadPipeline,
};
