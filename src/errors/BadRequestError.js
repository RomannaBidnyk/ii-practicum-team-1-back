const CustomAPIError = require("./CustomAPIError");

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message, 400);
  }
}

module.exports = BadRequestError;
