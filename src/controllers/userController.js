const { User } = require("../models");
const cloudinary = require("../config/cloudinaryConfig");
const {
  userInfoSchema: updateUserValidator,
} = require("../validators/userValidator");
const { BadRequestError, NotFoundError } = require("../errors");
const { StatusCodes } = require("http-status-codes");

const getUserInfo = async (req, res, next) => {
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
        "avatar_url",
      ],
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.status(StatusCodes.OK).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    const customError = new InternalServerError("Failed to fetch  info");
    customError.originalError = error;
    return next(customError);
  }
};

const updateUserInfo = async (req, res, next) => {
  try {
    const { error, value } = updateUserValidator.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      throw new BadRequestError(messages.join("; "));
    }

    const userEmail = req.user.email;

    const user = await User.findOne({ where: { email: userEmail } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const { first_name, last_name, phone_number, zip_code } = value;

    const uploadedImages = req.cloudinaryImages;

    if (uploadedImages && uploadedImages.length > 0) {
      const { secure_url, public_id } = uploadedImages[0];

      if (user.avatar_public_id) {
        await cloudinary.uploader.destroy(user.avatar_public_id);
      }

      await user.update({
        first_name,
        last_name,
        phone_number,
        zip_code,
        avatar_url: secure_url,
        avatar_public_id: public_id,
      });
    } else {
      await user.update({
        first_name,
        last_name,
        phone_number,
        zip_code,
      });
    }

    res.status(StatusCodes.OK).json({
      message: "User updated successfully",
      user: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        zip_code: user.zip_code,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    const customError = new InternalServerError("Failed to update user info");
    customError.originalError = error;
    return next(customError);
  }
};

module.exports = { getUserInfo, updateUserInfo };
