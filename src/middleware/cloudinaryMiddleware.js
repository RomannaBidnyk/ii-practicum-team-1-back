const cloudinary = require("../config/cloudinaryConfig");

/**
 * Requires req.file (must be used after multer middleware)
 */
const uploadImageMiddleware = async (req, res, next) => {
  if (!req.file) {
    console.error("uploadImageMiddleware used without multer!");
    return res
      .status(500)
      .json({ error: "Server error. Upload middleware misconfiguration." });
  }

  try {
    const base64Image = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "kindnet", // specify the folder in Cloudinary
      format: "jpg", // file format
    });

    req.uploadResult = result; // store the result for further use
    next(); // continue to the next middleware or route handler
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

const deleteImageMiddleware = async (req, res, next) => {
  const { public_id } = req.body;

  if (!public_id) {
    return res
      .status(400)
      .json({ error: "public_id is required to delete image" });
  }

  try {
    await cloudinary.uploader.destroy(public_id);
    next(); // continue to the next middleware or route handler
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
};

module.exports = { uploadImageMiddleware, deleteImageMiddleware };
