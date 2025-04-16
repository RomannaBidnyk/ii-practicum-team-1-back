const express = require("express");
const router = express.Router();
const {
  imageUploadPipeline,
  deleteImagePipeline,
} = require("../middleware/imageUploadAndDeletePipeline");

/**
 * This file will be deleted in the next PR - it is just for testing purposes to show upload/deletion works
 */

router.post("/test-upload", imageUploadPipeline, (req, res) => {
  res.status(200).json({
    message: "Image uploaded successfully",
    uploaded_image: req.uploadResult,
  });
});

router.delete("/test-delete", deleteImagePipeline, (req, res) => {
  res.status(200).json({
    message: "Image deleted successfully",
  });
});

module.exports = router;
