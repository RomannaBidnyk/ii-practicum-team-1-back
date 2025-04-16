const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto")
const { User } = require("../models");
const registerSchema = require("../validators/registerValidator");
const loginSchema = require("../validators/loginValidator");
const resetPasswordRequestSchema = require("../validators/resetPasswordRequestValidator");
const resetPasswordSchema = require("../validators/resetPasswordValidator");
const { BadRequestError, UnauthenticatedError } = require("../errors");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const passwordResetTokens = new Map();

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

      const newUser = await User.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        phone_number,
        zip_code,
      });

      const { password: _, ...userWithoutPassword } = newUser.toJSON();

      res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword,
      });
    } catch (err) {
      console.error("Registration error:", err);
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
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new UnauthenticatedError("Invalid email or password");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
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
      if (!user) {        
        return res.status(200).json({
          message: "If your email exists in our system, you will receive reset instructions."
        });
      }
     
      const resetToken = crypto.randomBytes(32).toString('hex');      
     
      passwordResetTokens.set(email.toLowerCase(), {
        token: resetToken,
        expires: Date.now() + 3600000 // 1 hour in milliseconds
      });

      // In a production  we will send this token via email?     
      return res.status(200).json({
        message: "If your email exists in our system, you will receive reset instructions.",
        // ONLY FOR TESTING 
        token: resetToken
      });
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

    const { email, token, newPassword } = value;
    const lowerEmail = email.toLowerCase();

    try {      
      const resetData = passwordResetTokens.get(lowerEmail);
      
      if (!resetData || resetData.token !== token) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      if (resetData.expires < Date.now()) {
        passwordResetTokens.delete(lowerEmail);
        return res.status(400).json({ message: "Token has expired" });
      }

      const user = await User.findByPk(lowerEmail);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (await bcrypt.compare(newPassword, user.password)) {
        return res.status(400).json({ message: "New password must be different from the old one" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await user.update({ password: hashedPassword });
 
      passwordResetTokens.delete(lowerEmail);

      return res.status(200).json({ message: "Password reset successful" });
    } catch (err) {
      console.error("Password reset error:", err);
      next(err);
    }
  }
};

module.exports = authController;
