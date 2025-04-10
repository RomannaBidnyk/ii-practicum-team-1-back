const cloudinary = require("../config/cloudinaryConfig");
const path = require("path");
const fs = require("fs");

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imagePath = path.join(__dirname, "../../uploads", req.file.filename); // Path to the uploaded image file

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "kindnet", //  folder in Cloudinary - e.g. use test_uploads for testing
    });

    // Delete the temporary image from your server after uploading to Cloudinary
    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      message: "Image uploaded successfully!",
      imageUrl: result.secure_url, // URL for the uploaded image https
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

module.exports = { uploadImage };
