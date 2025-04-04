const CustomAPIError = require("./CustomAPIError");

class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message, 401);
  }
}

module.exports = UnauthenticatedError;
