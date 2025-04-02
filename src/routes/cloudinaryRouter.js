const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { uploadImage } = require("../controllers/cloudinaryController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("image"), uploadImage); // Upload image to Cloudinary

module.exports = router;
