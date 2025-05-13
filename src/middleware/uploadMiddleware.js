const multer = require("multer");
const { BadRequestError } = require("../errors");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, //  Max file size: 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new BadRequestError("Only image files are allowed!"));
    }
    cb(null, true);
  },
});

module.exports = upload;
