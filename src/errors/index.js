const BadRequestError = require("./BadRequestError");
const UnauthenticatedError = require("./UnauthenticatedError");
const CustomAPIError = require("./CustomAPIError");
const NotFoundError = require("./NotFoundError");
const InternalServerError = require("./InternalServerError");

module.exports = {
  BadRequestError,
  UnauthenticatedError,
  CustomAPIError,
  NotFoundError,
  InternalServerError,
};
