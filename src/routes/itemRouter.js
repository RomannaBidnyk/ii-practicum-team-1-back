const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createItem,
  getAllItems,
  deleteItem,
} = require("../controllers/itemController");
const {
  imageUploadPipeline,
  deleteImagePipeline,
} = require("../middleware/imageUploadAndDeletePipeline");

router.get("/private", authMiddleware, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}. You are authorized.` });
});

router.get("/", getAllItems);

router.post("/", authMiddleware, imageUploadPipeline, createItem);
router.delete("/:id", authMiddleware, deleteItem);

module.exports = router;
