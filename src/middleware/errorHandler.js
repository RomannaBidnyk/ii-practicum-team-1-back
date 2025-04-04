
const { CustomAPIError } = require("../errors");

const errorHandler = (err, req, res, next) => {
console.log("💥 error name:", err.name);
console.log("💥 instanceof CustomAPIError:", err instanceof CustomAPIError);

  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error("Unexpected Error:", err);

  return res.status(500).json({
    message: "Something went wrong",
  });
};

module.exports = errorHandler;
