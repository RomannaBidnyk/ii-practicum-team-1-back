const { Item, User, Category, Image } = require("../models");
const cloudinary = require("../config/cloudinaryConfig");
const { Op } = require("sequelize");
const { BadRequestError, InternalServerError } = require("../errors");
const { sequelize } = require("../models");
const { itemSearchSchema } = require("../validators/zipValidator");
const itemSchema = require("../validators/itemValidator");
const itemIdParamSchema = require("../validators/itemIdParamValidator");
const updateItemSchema = require("../validators/itemUpdateValidator");
const { StatusCodes } = require("http-status-codes");

const createItem = async (req, res, next) => {
  const { error, value } = itemSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map((detail) => detail.message);
    return next(new BadRequestError(messages.join(", ")));
  }

  const t = await Item.sequelize.transaction();
  const { title, description, category_name, zip, item_status, can_deliver } =
    value;
  const user_email = req.user.email;

  const cloudinaryImages = req.cloudinaryImages;

  if (!cloudinaryImages || !cloudinaryImages.length) {
    return next(new BadRequestError("Image upload failed."));
  }

  try {
    const item = await Item.create(
      {
        title,
        description,
        category_name,
        zip,
        item_status,
        user_email,
        can_deliver: can_deliver === undefined ? false : can_deliver,
      },
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
    return res.status(StatusCodes.CREATED).json({
      message: "Item created successfully",
      item,
      images: cloudinaryImages.map((img) => img.secure_url),
    });
  } catch (err) {
    console.error("Error creating item:", err);
    await t.rollback();

    // Clean up any uploaded images
    let cleanupError = null;
    try {
      await Promise.all(
        cloudinaryImages.map((img) =>
          cloudinary.uploader.destroy(img.public_id)
        )
      );
    } catch (cleanupErrorCaught) {
      console.error("Error during Cloudinary cleanup:", cleanupErrorCaught);
      cleanupError = cleanupErrorCaught;
    }
    const customError = new InternalServerError("Failed to create item");
    customError.originalError = err;
    if (cleanupError) {
      customError.cleanupError = cleanupError;
    }
    return next(customError);
  }
};

const deleteItem = async (req, res, next) => {
  const { error } = itemIdParamSchema.validate(req.params);
  if (error) {
    const messages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: messages });
  }

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

    return res
      .status(StatusCodes.OK)
      .json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({ error: "Failed to delete item" });
  }
};

const getAllItems = async (req, res, next) => {
  try {
    const { error, value } = itemSearchSchema.validate(req.query);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { category, search, zip, limit, offset } = value;

    const whereConditions = {};

    if (category) {
      whereConditions.category_name = category;
    }

    if (zip) {
      whereConditions.zip = zip;
    }

    if (search) {
      const escapedSearch = search.replace(/[%_\\]/g, (char) => `\\${char}`);
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${escapedSearch}%` } },
        { description: { [Op.iLike]: `%${escapedSearch}%` } },
      ];
    }

    const totalItems = await Item.count({
      where: whereConditions,
    });

    const items = await Item.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          attributes: ["email", "first_name", "last_name", "avatar_url"],
        },
        {
          model: Category,
          attributes: ["category_name"],
        },
        {
          model: Image,
          attributes: ["id", "image_url"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return res.status(StatusCodes.OK).json({
      items,
      count: items.length,
      pagination: {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: currentPage,
        items_per_page: limit,
        has_next_page: currentPage < totalPages,
        has_prev_page: currentPage > 1,
      },
      filters: {
        category: category || null,
        search: search || null,
        zip: zip || null,
      },
    });
  } catch (err) {
    console.error("Error fetching items:", err);
    next(err);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return res.status(400).json({ error: "Item ID must be a number" });
    }

    const item = await Item.findByPk(itemId, {
      include: [
        {
          model: User,
          attributes: ["email", "first_name", "last_name", "avatar_url"],
        },
        {
          model: Category,
          attributes: ["category_name"],
        },
        {
          model: Image,
          attributes: ["id", "image_url"],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.status(StatusCodes.OK).json({ item });
  } catch (err) {
    console.error("Error fetching item:", err);
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  const { error, value } = updateItemSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ error: error.details.map((e) => e.message) });
  }

  const id = req.params.id;
  const userId = req.user.id;
  const {
    title,
    description,
    zip,
    item_status,
    category_name,
    can_deliver,
    deleteList: rawDeleteList,
  } = value;

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

    let deleteList = rawDeleteList;

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
        const isInDeleteList = deleteList.includes(img.id);
        return isInDeleteList;
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
          id: deleteList,
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
        can_deliver: can_deliver ?? item.can_deliver,
      },
      { transaction: t }
    );

    await t.commit();

    // Return updated item with images
    const updatedItem = await Item.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["email", "first_name", "last_name", "avatar_url"],
        },
        {
          model: Category,
          attributes: ["category_name"],
        },
        { model: Image, attributes: ["id", "image_url"] },
      ],
    });

    res.json(updatedItem);
  } catch (error) {
    await t.rollback();
    console.error("Update item error:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  deleteItem,
  updateItem,
};
