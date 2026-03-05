const Joi = require('joi');

const updateCompanySchema = Joi.object({
  name: Joi.string().trim(),
  industry: Joi.string().trim().allow(''),
  phone: Joi.string().trim().allow(''),
  address: Joi.string().trim().allow(''),
  isActive: Joi.boolean(),
}).min(1);

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('owner', 'admin', 'viewer').required(),
});

module.exports = {
  updateCompanySchema,
  updateUserRoleSchema,
};
