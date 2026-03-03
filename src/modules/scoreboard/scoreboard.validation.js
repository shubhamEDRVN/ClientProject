const Joi = require('joi');

const createResourceSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).allow('').default(''),
  resource_type: Joi.string().valid('youtube', 'pdf', 'course', 'other').default('other'),
  url: Joi.string().trim().uri().max(2000).required(),
  category: Joi.string().trim().max(100).allow('').default(''),
  display_order: Joi.number().integer().min(0).default(0),
});

const updateResourceSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().max(1000).allow(''),
  resource_type: Joi.string().valid('youtube', 'pdf', 'course', 'other'),
  url: Joi.string().trim().uri().max(2000),
  category: Joi.string().trim().max(100).allow(''),
  display_order: Joi.number().integer().min(0),
}).min(1);

const updateProgressSchema = Joi.object({
  completed: Joi.boolean().required(),
});

module.exports = { createResourceSchema, updateResourceSchema, updateProgressSchema };
