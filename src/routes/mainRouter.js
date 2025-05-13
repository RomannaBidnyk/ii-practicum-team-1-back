const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController.js");

const authRouter = require("./authRouter");
const googleAuthRouter = require("./googleAuthRouter");
const itemRouter = require("./itemRouter");
const reviewRouter = require("./reviewRouter");
const userRouter = require("./userRouter");

router.use("/auth", authRouter);
router.use("/auth", googleAuthRouter);
router.use("/items", itemRouter);
router.use("/reviews", reviewRouter);
router.use("/user", userRouter);

router.get("/", mainController.get);

module.exports = router;
