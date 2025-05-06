const { User } = require("../models");

const getUserInfo = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const user = await User.findOne({
      where: { email: userEmail },
      attributes: [
        "email",
        "first_name",
        "last_name",
        "phone_number",
        "zip_code",
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getUserInfo };
