const { Item, User, Category, Image } = require("../models");
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

const getAllItems = async (req, res) => {
  try {
    const {category} = req.query;
    const whereConditions = {};
    if(category) {
      whereConditions.category_name = category;
    }

    const items = await Item.findAll({
      where: whereConditions,  
      include: [
        {
          model: User,
          attributes: ["email", "first_name", "last_name"],
        },
        {
          model: Category,
          attributes: ["category_name"],
        },
        {
          model: Image,
          attributes: ["public_id", "image_url"],
        }
      ],
      order: [['createdAt', "DESC"]],  
    });

    return res.status(200).json({ items, count: items.length });
  } catch (error) {
    console.error("Error fetching items:", error);
    return res.status(500).json({ error: "Failed to fetch items" });
  }
};

module.exports = { createItem , getAllItems};
