const cloudinary = require("../config/cloudinaryConfig");

/**
 * Requires req.file (must be used after multer middleware)
 */
const uploadImageMiddleware = async (req, res, next) => {
  try {
    const files = req.files;

    // If it's a PUT request and no files are uploaded, just continue
    if (req.method === "PUT" && (!files || files.length === 0)) {
      req.cloudinaryImages = []; // no new images
      return next();
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one image is required." });
    }

    const cloudinaryUploads = await Promise.all(
      files.map((file) => {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString(
          "base64"
        )}`;
        return cloudinary.uploader.upload(base64, {
          folder: "kindnet",
          format: "jpg",
        });
      })
    );

    req.cloudinaryImages = cloudinaryUploads;
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
