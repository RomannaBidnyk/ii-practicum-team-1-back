const CustomAPIError = require("./CustomAPIError");
const { StatusCodes } = require("http-status-codes");

class LockedError extends CustomAPIError {
  constructor(message) {
    super(message, StatusCodes.LOCKED);
  }
}

module.exports = LockedError;
