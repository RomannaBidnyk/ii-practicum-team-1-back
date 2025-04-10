const cloudinary = require("../config/cloudinaryConfig");

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Convert buffer to base64 string
    const base64Image = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "kindnet", //  folder in Cloudinary - e.g. use test_uploads for testing
    });

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
