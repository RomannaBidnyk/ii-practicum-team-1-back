const { Feedback, User, Item } = require("../models");

const createReview = async (req, res) => {
  const {
    item_id,
    giver_user_email,
    receiver_user_email,
    rating,
    description,
  } = req.body;

  // Validation
  if (!item_id || !giver_user_email || !receiver_user_email || !rating) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    // Check if item exists
    const item = await Item.findByPk(item_id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Check if giver user exists
    const giverUser = await User.findOne({
      where: { email: giver_user_email },
    });
    if (!giverUser) {
      return res.status(404).json({ error: "Giver user not found" });
    }

    // Check if receiver user exists
    const receiverUser = await User.findOne({
      where: { email: receiver_user_email },
    });
    if (!receiverUser) {
      return res.status(404).json({ error: "Receiver user not found" });
    }

    // Check if the giver is not the same as the receiver
    if (giver_user_email === receiver_user_email) {
      return res
        .status(400)
        .json({ error: "Giver and receiver cannot be the same" });
    }

    // Create feedback (review)
    const feedback = await Feedback.create({
      item_id,
      giver_user_email,
      receiver_user_email,
      rating,
      description,
    });

    return res.status(201).json({
      message: "Review created successfully",
      feedback,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({ error: "Failed to create review" });
  }
};

module.exports = { createReview };
