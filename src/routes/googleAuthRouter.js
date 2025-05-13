const express = require("express");
const passport = require("passport");
const router = express.Router();
const googleAuthController = require("../controllers/googleAuthController");
const authMiddleware = require("../middleware/authMiddleware");

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
    session: false,
  }),
  googleAuthController.googleCallback
);

router.post(
  "/link-google",
  authMiddleware,
  googleAuthController.linkGoogleAccount
);

module.exports = router;
