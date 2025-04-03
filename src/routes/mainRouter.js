const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController.js');

const authRouter = require("./authRouter");


router.use("/auth", authRouter);

router.get('/', mainController.get);
  
module.exports = router;