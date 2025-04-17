const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { createItem } = require("../controllers/itemController");
const {
  imageUploadPipeline,
  deleteImagePipeline,
} = require("../middleware/imageUploadAndDeletePipeline");

router.get("/private", authMiddleware, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}. You are authorized.` });
});

router.post("/", authMiddleware, imageUploadPipeline, createItem);

module.exports = router;
