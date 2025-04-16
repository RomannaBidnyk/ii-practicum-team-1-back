const Joi = require("joi");

const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required"
    }),
  token: Joi.string()
    .required()
    .messages({
      "any.required": "Reset token is required"
    }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "New password is required"
    })
});

module.exports = resetPasswordSchema;