const { CustomAPIError } = require("../errors");
const { StatusCodes } = require("http-status-codes");

const errorHandler = (err, req, res, next) => {
  console.log("💥 error name:", err.name);
  console.log("💥 instanceof CustomAPIError:", err instanceof CustomAPIError);

  if (err instanceof CustomAPIError) {
    console.error("Original error:", err.originalError || err);
    if (err.cleanupError) {
      console.error("Cleanup error:", err.cleanupError);
    }
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error("Unexpected Error:", err);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Something went wrong",
  });
};

module.exports = errorHandler;
