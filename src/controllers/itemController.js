const { Item, User, Category, Image } = require("../models");
const cloudinary = require("../config/cloudinaryConfig");
const { Op } = require("sequelize");
const { BadRequestError } = require("../errors");

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

const deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Item.findOne({
      where: { item_id: id },
      include: [Image],
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    console.log("Item with images:", item);

    // Check if the authenticated user owns the item
    if (req.user.email !== item.user_email) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this item" });
    }

    // Delete all associated images from Cloudinary
    await Promise.all(
      item.images.map((img) =>
        cloudinary.uploader.destroy(img.dataValues.public_id)
      )
    );

    await Image.destroy({ where: { item_id: id } });
    await Item.destroy({ where: { item_id: id } });

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({ error: "Failed to delete item" });
  }
};

const getAllItems = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const whereConditions = {};

    if (category) {
      whereConditions.category_name = category;
    }

    if (search && typeof search === "string") {
      const trimmedSearch = search.trim();

      if (trimmedSearch.length >= 2 && trimmedSearch.length <= 100) {
        const escapedSearch = trimmedSearch.replace(
          /[%_\\]/g,
          (char) => `\\${char}`
        );
        whereConditions[Op.or] = [
          { title: { [Op.iLike]: `%${escapedSearch}%` } },
          { description: { [Op.iLike]: `%${escapedSearch}%` } },
        ];
      }
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
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      items,
      count: items.length,
      filters: {
        category: category || null,
        search: search || null,
      },
    });
  } catch (err) {
    console.error("Error fetching items:", err);
    next(err);
  }
};

module.exports = { createItem, getAllItems, deleteItem };
