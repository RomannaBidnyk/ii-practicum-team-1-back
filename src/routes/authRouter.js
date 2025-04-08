const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const { User } = require("../models");
const registerSchema = require("../validators/registerValidator");

// POST /api/v1/auth/register
router.post("/register", async (req, res) => {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

  let { email, password, first_name, last_name, phone_number, zip_code } = value;

  try {
    const existingUser = await User.findByPk(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
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

    // Don't send the password back in the response
    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json({ message: "User registered successfully", user: userWithoutPassword });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
