const Joi = require("joi");

const itemSchema = Joi.object({
  title: Joi.string().min(2).max(100).required().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title is required",
    "any.required": "Title is required",
  }),

  description: Joi.string().allow("").max(1000),

  category_name: Joi.string().max(100).optional(),

  zip: Joi.string()
    .pattern(/^\d{5}$/)
    .required()
    .messages({
      "string.pattern.base": "ZIP code must be exactly 5 digits",
      "string.empty": "ZIP code is required",
      "any.required": "ZIP code is required",
    }),

  item_status: Joi.string()
    .valid("available", "unavailable", "pending")
    .required()
    .messages({
      "any.only":
        "Item status must be 'available', 'unavailable', or 'pending'",
      "string.empty": "Item status is required",
      "any.required": "Item status is required",
    }),

  can_deliver: Joi.boolean().optional(),
});

module.exports = itemSchema;
