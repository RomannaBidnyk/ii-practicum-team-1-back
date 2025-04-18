const { Item, Image } = require("../models");
const cloudinary = require("../config/cloudinaryConfig");

const createItem = async (req, res) => {
  const t = await Item.sequelize.transaction();
  const { title, description, category_name, zip, item_status, user_email } =
    req.body;

  const cloudinaryImages = req.cloudinaryImages;

  if (!cloudinaryImages || !cloudinaryImages.length) {
    return res.status(400).json({ error: "Image upload failed." });
  }

  try {
    const item = await Item.create(
      { title, description, category_name, zip, item_status, user_email },
      { transaction: t }
    );

    await Promise.all(
      cloudinaryImages.map((img) =>
        Image.create(
          {
            public_id: img.public_id,
            image_url: img.secure_url,
            item_id: item.item_id,
          },
          { transaction: t }
        )
      )
    );

    await t.commit();
    return res.status(201).json({
      message: "Item created successfully",
      item,
      images: cloudinaryImages.map((img) => img.secure_url),
    });
  } catch (err) {
    console.error("Error creating item:", err);
    await t.rollback();

    // Clean up any uploaded images
    try {
      await Promise.all(
        cloudinaryImages.map((img) =>
          cloudinary.uploader.destroy(img.public_id)
        )
      );
    } catch (cleanupError) {
      console.error("Error during Cloudinary cleanup:", cleanupError);
    }

    return res.status(500).json({ error: "Failed to create item" });
  }
};

module.exports = { createItem };
