const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const registerSchema = require("../validators/registerValidator");
const loginSchema = require("../validators/loginValidator");
const { BadRequestError, UnauthenticatedError } = require("../errors");

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
};

module.exports = authController;
