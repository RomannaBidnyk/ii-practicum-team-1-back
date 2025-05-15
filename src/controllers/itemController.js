const { Item, User, Category, Image } = require("../models");
const cloudinary = require("../config/cloudinaryConfig");
const { Op } = require("sequelize");
const {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  ForbiddenError,
} = require("../errors");
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
    return next(new BadRequestError(messages.join("; ")));
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
    return next(new BadRequestError(messages.join("; ")));
  }

  const { id } = req.params;

  try {
    const item = await Item.findOne({
      where: { item_id: id },
      include: [Image],
    });

    if (!item) {
      return next(new NotFoundError("Item not found"));
    }

    console.log("Item with images:", item);

    // Check if the authenticated user owns the item
    if (req.user.email !== item.user_email) {
      return next(new ForbiddenError("Unauthorized to delete this item"));
    }

    // Delete all associated images from Cloudinary
    try {
      await Promise.all(
        item.images.map((img) =>
          cloudinary.uploader.destroy(img.dataValues.public_id)
        )
      );
    } catch (cloudErr) {
      console.error("Cloudinary deletion error:", cloudErr);
    }

    await Image.destroy({ where: { item_id: id } });
    await Item.destroy({ where: { item_id: id } });

    return res
      .status(StatusCodes.OK)
      .json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    const customError = new InternalServerError("Failed to delete item");
    customError.originalError = error;
    return next(customError);
  }
};

const getAllItems = async (req, res, next) => {
  try {
    const { error, value } = itemSearchSchema.validate(req.query);

    if (error) {
      return next(new BadRequestError(error.details[0].message));
    }

    const { category, search, zip, limit, offset, self } = value;

    const whereConditions = {};

        if (self === true) {
      whereConditions.user_email = req.user.email; //email from JWT token
    }

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
        self: self || null,
      },
    });
  } catch (err) {
    console.error("Error fetching items:", err);
    const customError = new InternalServerError("Failed to fetch item");
    customError.originalError = err;
    return next(customError);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return next(new BadRequestError("Item ID must be a number"));
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
      return next(new NotFoundError("Item not found"));
    }

    return res.status(StatusCodes.OK).json({ item });
  } catch (err) {
    console.error("Error fetching item:", err);
    const customError = new InternalServerError("Failed to fetch item");
    customError.originalError = err;
    return next(customError);
  }
};

const updateItem = async (req, res, next) => {
  const { error, value } = updateItemSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message);
    return next(new BadRequestError(messages.join("; ")));
  }

  const id = req.params.id;
  const userEmail = req.user.email;
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
      await t.rollback();
      return next(new NotFoundError("Item not found"));
    }

    if (item.user_email !== userEmail) {
      await t.rollback();
      return next(new ForbiddenError("You can only update your own items"));
    }

    let category = null;
    if (category_name) {
      category = await Category.findOne({ where: { category_name } });
      if (!category) {
        await t.rollback();
        return next(new BadRequestError("Invalid category"));
      }
    }

    // Delete selected images (if any)
    let deleteList = rawDeleteList;

    if (typeof deleteList === "string") {
      try {
        deleteList = JSON.parse(deleteList);
      } catch (e) {
        console.error("Failed to parse deleteList:", e);
        return next(new BadRequestError("Invalid format for deleteList"));
      }
    }

    console.log("Images ids to delete:", deleteList);
    if (deleteList && Array.isArray(deleteList)) {
      const imagesToDelete = item.images.filter((img) => {
        return deleteList.includes(img.id);
      });
      if (imagesToDelete.length !== deleteList.length) {
        await t.rollback();
        return next(
          new BadRequestError(
            "One or more specified image IDs do not belong to this item"
          )
        );
      }

      // Delete from Cloudinary
      try {
        await Promise.all(
          imagesToDelete.map((img) =>
            cloudinary.uploader.destroy(img.public_id)
          )
        );
      } catch (cloudErr) {
        console.error("Cloudinary deletion error:", cloudErr);
      }

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

    return res.status(StatusCodes.OK).json(updatedItem);
  } catch (error) {
    await t.rollback();
    console.error("Update item error:", error);
    const internalErr = new InternalServerError("Failed to update item");
    internalErr.originalError = err;
    return next(internalErr);
  }
};

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  deleteItem,
  updateItem,
};
