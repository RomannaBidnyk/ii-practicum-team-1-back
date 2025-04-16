const Joi = require("joi");

const resetPasswordRequestSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required"
    })
});

module.exports = resetPasswordRequestSchema;