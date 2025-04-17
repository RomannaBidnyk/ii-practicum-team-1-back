const {
  uploadImageMiddleware,
  deleteImageMiddleware,
} = require("./cloudinaryMiddleware");
const upload = require("./uploadMiddleware");
const multer = require("multer");

const handleMulterErrors = (req, res, next) => {
  upload.array("image")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File too large. Max size is 5MB." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// This guarantees the right order
const imageUploadPipeline = [handleMulterErrors, uploadImageMiddleware];

const deleteImagePipeline = [deleteImageMiddleware];

module.exports = { imageUploadPipeline, deleteImagePipeline };
