const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUserInfo,
  updateUserInfo,
} = require("../controllers/userController");
const {
  singleImageUploadPipeline,
} = require("../middleware/imageUploadAndDeletePipeline");

router.get("/info", authMiddleware, getUserInfo);
router.put("/info", authMiddleware, singleImageUploadPipeline, updateUserInfo);

module.exports = router;
