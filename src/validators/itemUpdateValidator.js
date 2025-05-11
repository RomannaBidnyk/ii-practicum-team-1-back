const Joi = require("joi");

const updateItemSchema = Joi.object({
  title: Joi.string().min(2).max(100),
  description: Joi.string().allow("").max(1000),
  zip: Joi.string()
    .pattern(/^\d{5}$/)
    .messages({
      "string.pattern.base": "ZIP code must be exactly 5 digits",
    }),
  item_status: Joi.string()
    .valid("available", "unavailable", "pending")
    .messages({
      "any.only":
        "Item status must be 'available', 'unavailable', or 'pending'",
    }),
  category_name: Joi.string().max(100),
  can_deliver: Joi.boolean(),
  deleteList: Joi.alternatives().try(
    Joi.array().items(Joi.string().guid({ version: "uuidv4" })),
    Joi.string()
  ),
});

module.exports = updateItemSchema;
