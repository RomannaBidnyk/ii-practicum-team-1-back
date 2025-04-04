const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/private", authMiddleware, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}. You are authorized.` });
});

module.exports = router;
