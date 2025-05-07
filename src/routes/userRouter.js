const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUserInfo,
  updateUserInfo,
} = require("../controllers/userController");
const {
  imageUploadPipeline,
} = require("../middleware/imageUploadAndDeletePipeline");

router.get("/info", authMiddleware, getUserInfo);
router.put("/info", authMiddleware, imageUploadPipeline, updateUserInfo);

module.exports = router;
