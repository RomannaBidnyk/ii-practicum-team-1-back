const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
//const validateResetToken = require("../middleware/validateResetToken");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authMiddleware, (req, res) => {
  res.status(200).json({ message: `User ${req.user.email} logged out.` });
});

router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
