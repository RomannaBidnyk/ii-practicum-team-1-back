const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getUserInfo } = require("../controllers/userController");

router.get("/info", authMiddleware, getUserInfo);

module.exports = router;
