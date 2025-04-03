const Joi = require("joi");

const registerSchema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } }) // switch off  .com/.org etc
      .lowercase()
      .required(),
  
    password: Joi.string()
      .min(6)
      .required(),
  
    first_name: Joi.string()
      .min(2)
      .required(),
  
    last_name: Joi.string()
      .min(2)
      .required(),
  
    phone_number: Joi.string()
      .pattern(/^\+?\d{7,15}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone number must contain only digits and may start with +",
      }),
  
    zip_code: Joi.string()
      .pattern(/^\d{5}$/)
      .required()
      .messages({
        "string.pattern.base": "ZIP code must be exactly 5 digits",
      }),
  });

module.exports = registerSchema;
