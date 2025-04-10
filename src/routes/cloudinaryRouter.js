const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  uploadImage,
  deleteImage,
} = require("../controllers/cloudinaryController");
const multer = require("multer");

const handleMulterErrors = (req, res, next) => {
  upload.single("image")(req, res, function (err) {
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

router.post("/upload", handleMulterErrors, uploadImage); // Upload image to Cloudinary
router.delete("/delete", deleteImage);

module.exports = router;
