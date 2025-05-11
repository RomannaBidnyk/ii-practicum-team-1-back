const Joi = require("joi");

const userInfoSchema = Joi.object({
  first_name: Joi.string().trim().min(2).max(50).required().messages({
    "string.min": "First name must be at least 2 characters long",
    "string.empty": "First name is required",
    "any.required": "First name is required",
  }),
  last_name: Joi.string().trim().min(2).max(50).required().messages({
    "string.min": "Last name must be at least 2 characters long",
    "string.empty": "Last name is required",
    "any.required": "Last name is required",
  }),
  phone_number: Joi.string()
    .pattern(/^\+?\d{7,15}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must contain only digits and may start with +",
      "string.empty": "Phone number is required",
      "any.required": "Phone number is required",
    }),
  zip_code: Joi.string()
    .pattern(/^\d{5}$/)
    .required()
    .messages({
      "string.pattern.base": "ZIP code must be exactly 5 digits",
      "string.empty": "ZIP code is required",
      "any.required": "ZIP code is required",
    }),
});

module.exports = { userInfoSchema };
