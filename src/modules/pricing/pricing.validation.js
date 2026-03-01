const Joi = require('joi');

const serviceItemSchema = Joi.object({
  _id: Joi.string().optional(),
  name: Joi.string().trim().min(1).max(200).required(),
  category: Joi.string().valid('hvac', 'plumbing', 'electrical', 'general').default('general'),
  description: Joi.string().trim().max(500).allow('').default(''),
  material_cost: Joi.number().min(0).default(0),
  material_markup_pct: Joi.number().min(0).max(500).default(25),
  labor_hours: Joi.number().min(0).max(1000).default(1),
  hourly_rate_override: Joi.number().min(0).allow(null).default(null),
});

const pricingMatrixSchema = Joi.object({
  services: Joi.array().items(serviceItemSchema).max(200).default([]),
  default_markup_pct: Joi.number().min(0).max(500).default(25),
});

module.exports = { pricingMatrixSchema, serviceItemSchema };
