const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models");
const registerSchema = require("../validators/registerValidator");
const loginSchema = require("../validators/loginValidator");
const resetPasswordRequestSchema = require("../validators/resetPasswordRequestValidator");
const resetPasswordSchema = require("../validators/resetPasswordValidator");
const { BadRequestError, UnauthenticatedError } = require("../errors");
const { PasswordResetToken } = require("../models");
const { Op } = require("sequelize");
const { sendPasswordResetEmail, sendVerificationEmail } = require("../services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const authController = {
  async register(req, res, next) {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let { email, password, first_name, last_name, phone_number, zip_code } =
      value;

    try {
      const existingUser = await User.findByPk(email);
      if (existingUser) {
        throw new BadRequestError("User already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const verificationToken = crypto.randomBytes(32).toString("hex");

      const newUser = await User.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        phone_number,
        zip_code,
        verification_token: verificationToken,
        is_verified: false,
      });

      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${email}`;
      await sendVerificationEmail(email, verificationUrl);

      const {
        password: _,
        verification_token: __,
        ...userWithoutPassword
      } = newUser.toJSON();

      res.status(201).json({
        message:
          "User registered successfully. Please check your email to verify your account.",
        user: userWithoutPassword,
      });
    } catch (err) {
      console.error("Registration error:", err);
      next(err);
    }
  },

  async verifyEmail(req, res, next) {
    const { email, token } = req.query;

    try {
      const user = await User.findOne({
        where: {
          email: email.toLowerCase(),
          verification_token: token,
          is_verified: false,
        },
      });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid or expired verification token" });
      }

      await user.update({
        is_verified: true,
        verification_token: null,
      });

      res
        .status(200)
        .json({ message: "Email verified successfully! You can now login." });
    } catch (err) {
      console.error("Email verification error:", err);
      next(err);
    }
  },

  async login(req, res, next) {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = value;

    try {
      const user = await User.findByPk(email.toLowerCase());

      if (!user) {
        throw new UnauthenticatedError("Invalid email or password");
      }

      if (user.locked_until && user.locked_until > new Date()) {
        return res.status(423).json({
          message: "Account is locked. Please try again later.",
        });
      }

      if (!user.is_verified) {
        return res.status(403).json({
          message: "Please verify your email before logging in.",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
      const failedAttempts = user.failed_login_attempts + 1;
      const updateData = { failed_login_attempts: failedAttempts };
      
      if (failedAttempts >= 5) {
        updateData.locked_until = new Date(Date.now() + 30 * 60 * 1000);
      }
      
      await user.update(updateData);
      
      throw new UnauthenticatedError("Invalid email or password");
    }

        if (user.failed_login_attempts > 0) {
      await user.update({ 
        failed_login_attempts: 0,
        locked_until: null 
      });
    }

      const token = jwt.sign({ email: user.email }, JWT_SECRET, {
        expiresIn: "2h",
      });

      const { password: _, ...userWithoutPassword } = user.toJSON();

      res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword,
        token,
      });
    } catch (err) {
      console.error("Login error:", err);
      next(err);
    }
  },

  async requestPasswordReset(req, res, next) {
    const { error, value } = resetPasswordRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email } = value;

    try {
      const user = await User.findByPk(email.toLowerCase());
      const responseMessage =
        "If your email exists in our system, you will receive reset instructions.";
      if (!user) {
        return res.status(200).json({ message: responseMessage });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      await PasswordResetToken.destroy({
        where: { email: email.toLowerCase() },
      });

      await PasswordResetToken.create({
        email: email.toLowerCase(),
        token: hashedToken,
        expires_at: new Date(Date.now() + 3600000),
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

      // Send email
      await sendPasswordResetEmail(email, resetUrl);

      return res.status(200).json({ message: responseMessage });
    } catch (err) {
      console.error("Password reset request error:", err);
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { token, newPassword } = value;

    try {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const resetToken = await PasswordResetToken.findOne({
        where: {
          token: hashedToken,
          expires_at: { [Op.gt]: new Date() },
        },
      });

      if (!resetToken) {
        return res.status(400).json({
          message:
            "This password reset link is invalid or has expired. Please request a new one.",
        });
      }

      const userEmail = resetToken.email;

      const user = await User.findByPk(userEmail);
      if (!user) {
        return res
          .status(404)
          .json({ message: "User account not found. Please contact support." });
      }

      if (await bcrypt.compare(newPassword, user.password)) {
        return res.status(400).json({
          message:
            "Your new password cannot be the same as your current password. Please choose a different password.",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      await PasswordResetToken.destroy({
        where: { email: userEmail },
      });

      return res.status(200).json({
        message:
          "Your password has been successfully reset. You can now log in with your new password.",
      });
    } catch (err) {
      console.error("Password reset error:", err);
      return res.status(500).json({
        message:
          "An error occurred while resetting your password. Please try again or contact support.",
      });
    }
  },
};

module.exports = authController;
