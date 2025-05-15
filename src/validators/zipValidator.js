const Joi = require("joi");

const zipSchema = Joi.string()
  .pattern(/^\d{5}$/)
  .messages({
    "string.pattern.base": "ZIP code must be exactly 5 digits",
  });

const itemSearchSchema = Joi.object({
  category: Joi.string().trim().allow(null, ""),
  search: Joi.string().trim().min(2).max(100).allow(null, ""),
  zip: zipSchema.trim().allow(null, ""),
  limit: Joi.number().integer().min(1).max(100).default(12),
  offset: Joi.number().integer().min(0).default(0),
  can_deliver: Joi.boolean().optional(),
  self: Joi.boolean().optional(),
}).unknown(false);

module.exports = {
  zipSchema,
  itemSearchSchema,
};
