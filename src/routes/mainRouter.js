const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController.js");

const authRouter = require("./authRouter");
const itemRouter = require("./itemRouter");
const reviewRouter = require("./reviewRouter");

router.use("/auth", authRouter);
router.use("/items", itemRouter);
router.use("/reviews", reviewRouter);

router.get("/", mainController.get);

module.exports = router;
