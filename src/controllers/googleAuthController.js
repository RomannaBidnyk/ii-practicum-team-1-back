const { User } = require("../models");
const jwt = require("jsonwebtoken");
const BadRequestError = require("../errors/BadRequestError");
const UnauthenticatedError = require("../errors/UnauthenticatedError");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const googleAuthController = {
  async googleCallback(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthenticatedError("Authentication failed");
      }

      const { email, firstName, lastName, picture } = req.user;

      let user = await User.findByPk(email);

      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString("hex");

        user = await User.create({
          email,
          password: randomPassword,
          first_name: firstName || "Google",
          last_name: lastName || "User",
          phone_number: "0000000000",
          zip_code: "00000",
          is_verified: true,
          avatar_url: picture,
          google_id: req.user.id,
        });
      } else if (!user.google_id) {
        await user.update({
          google_id: req.user.id,
          is_verified: true,
          avatar_url: user.avatar_url || picture,
        });
      }

      const token = jwt.sign({ email: user.email }, JWT_SECRET, {
        expiresIn: "2h",
      });

      const params = new URLSearchParams({
        token: token,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      });

      const redirectUrl = `${
        process.env.FRONTEND_URL
      }/login?${params.toString()}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google authentication error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  },

  async linkGoogleAccount(req, res, next) {
    try {
      const { googleId, googleEmail } = req.body;
      const userEmail = req.user.email;

      if (!googleId || !googleEmail) {
        throw new BadRequestError("Google account info missing");
      }

      const user = await User.findByPk(userEmail);
      if (!user) {
        throw new UnauthenticatedError("User not found");
      }

      await user.update({
        google_id: googleId,
      });

      res.status(StatusCodes.OK).json({
        message: "Google account linked successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = googleAuthController;
