const BadRequestError = require("./BadRequestError");
const UnauthenticatedError = require("./UnauthenticatedError");
const CustomAPIError = require("./CustomAPIError");
const NotFoundError = require("./NotFoundError");
const InternalServerError = require("./InternalServerError");
const ForbiddenError = require("./ForbiddenError");
const LockedError = require("./LockedError");

module.exports = {
  BadRequestError,
  UnauthenticatedError,
  CustomAPIError,
  NotFoundError,
  InternalServerError,
  ForbiddenError,
  LockedError,
};
