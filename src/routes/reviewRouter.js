const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { createReview } = require("../controllers/reviewController");

router.post("/", authMiddleware, createReview);

module.exports = router;
