const Joi = require("joi");

const itemIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Item ID must be a number",
    "number.integer": "Item ID must be an integer",
    "number.positive": "Item ID must be a positive number",
    "any.required": "Item ID is required",
  }),
});

module.exports = itemIdParamSchema;
