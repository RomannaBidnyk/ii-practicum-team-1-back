const { Item, User, Category, Image } = require("../models");
const cloudinary = require("../config/cloudinaryConfig");
const { Op } = require("sequelize");
const { BadRequestError } = require("../errors");
const { sequelize } = require("../models");

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
};

const updateItem = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const { title, description, zip, item_status, category_name } = req.body;

  const t = await sequelize.transaction();

  try {
    const item = await Item.findByPk(id, {
      include: [{ model: Image }],
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (item.user_id !== userId) {
      return res
        .status(403)
        .json({ error: "You can only update your own items" });
    }

    let category = null;
    if (category_name) {
      category = await Category.findOne({ where: { category_name } });
      if (!category) {
        return res.status(400).json({ error: "Invalid category" });
      }
    }

    // Delete selected images (if any)

    let deleteList = req.body.deleteList;

    if (typeof deleteList === "string") {
      try {
        deleteList = JSON.parse(deleteList);
      } catch (e) {
        console.error("Failed to parse deleteList:", e);
        deleteList = [];
      }
    }

    console.log("Images ids to delete:", deleteList);
    if (deleteList && Array.isArray(deleteList)) {
      const imagesToDelete = item.images.filter((img) => {
        const isInDeleteList = deleteList.includes(img.public_id);
        const belongsToItem = img.item_id === item.item_id;
        return isInDeleteList && belongsToItem;
      });
      if (imagesToDelete.length !== deleteList.length) {
        return res
          .status(400)
          .json({ error: "Some images to delete do not belong to this item." });
      }

      // Delete from Cloudinary
      await Promise.all(
        imagesToDelete.map((img) => cloudinary.uploader.destroy(img.public_id))
      );

      // Delete from DB
      await Image.destroy({
        where: {
          public_id: deleteList,
          item_id: id,
        },
        transaction: t,
      });
    }

    // Upload new images from req.cloudinaryImages
    const uploadedImages = req.cloudinaryImages || [];
    const newImagesData = uploadedImages.map((img) => ({
      item_id: item.item_id,
      image_url: img.secure_url,
      public_id: img.public_id,
    }));

    if (newImagesData.length > 0) {
      await Image.bulkCreate(newImagesData, { transaction: t });
    }

    // Update item fields
    await item.update(
      {
        title: title ?? item.title,
        description: description ?? item.description,
        zip: zip ?? item.zip,
        item_status: item_status ?? item.item_status,
        category_id: category ? category.category_id : item.category_id,
      },
      { transaction: t }
    );

    await t.commit();

    // Return updated item with images
    const updatedItem = await Item.findByPk(id, {
      include: [{ model: Image }],
    });

    res.json(updatedItem);
  } catch (error) {
    await t.rollback();
    console.error("Update item error:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

module.exports = { createItem, getAllItems, deleteItem, updateItem };
