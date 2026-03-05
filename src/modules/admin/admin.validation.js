const Joi = require('joi');
const { VALID_ROLES } = require('../../utils/constants');

const updateCompanySchema = Joi.object({
  name: Joi.string().trim(),
  industry: Joi.string().trim().allow(''),
  phone: Joi.string().trim().allow(''),
  address: Joi.string().trim().allow(''),
  isActive: Joi.boolean(),
}).min(1);

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid(...VALID_ROLES).required(),
});

module.exports = {
  updateCompanySchema,
  updateUserRoleSchema,
};
