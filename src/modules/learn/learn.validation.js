const Joi = require('joi');

const createSystemSchema = Joi.object({
  category: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow('').default(''),
  sortOrder: Joi.number().integer().default(0),
});

const updateSystemSchema = Joi.object({
  category: Joi.string(),
  name: Joi.string(),
  description: Joi.string().allow(''),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
}).min(1);

const createResourceSchema = Joi.object({
  systemId: Joi.string().required(),
  type: Joi.string().valid('video', 'pdf').required(),
  title: Joi.string().required(),
  description: Joi.string().allow('').default(''),
  url: Joi.string().uri().required(),
  sortOrder: Joi.number().integer().default(0),
});

const updateResourceSchema = Joi.object({
  type: Joi.string().valid('video', 'pdf'),
  title: Joi.string(),
  description: Joi.string().allow(''),
  url: Joi.string().uri(),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
}).min(1);

module.exports = {
  createSystemSchema,
  updateSystemSchema,
  createResourceSchema,
  updateResourceSchema,
};
