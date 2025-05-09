const Joi = require("joi");

const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      "any.required": "Reset token is required",
      "string.empty": "Reset token cannot be empty"
    }),
  newPassword: Joi.string()
    .min(8)
    .max(100)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password must not exceed 100 characters",
      "string.empty": "Password cannot be empty",
      "any.required": "New password is required"
    })
});

module.exports = resetPasswordSchema;