const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createItem,
  getAllItems,
  getItemById,
  deleteItem,
  updateItem,
} = require("../controllers/itemController");
const {
  imageUploadPipeline,
  deleteImagePipeline,
} = require("../middleware/imageUploadAndDeletePipeline");

router.get("/private", authMiddleware, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}. You are authorized.` });
});

router.get("/", authMiddleware, getAllItems);
router.get("/:id", authMiddleware, getItemById);
router.post("/", authMiddleware, imageUploadPipeline, createItem);
router.delete("/:id", authMiddleware, deleteItem);
router.put("/:id", authMiddleware, imageUploadPipeline, updateItem);

module.exports = router;
