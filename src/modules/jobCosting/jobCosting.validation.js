const Joi = require('joi');

const lineItemSchema = Joi.object({
  _id: Joi.string().optional(),
  name: Joi.string().trim().min(1).max(200).required(),
  category: Joi.string().valid('hvac', 'plumbing', 'electrical', 'general').default('general'),
  description: Joi.string().trim().max(500).allow('').default(''),
  material_cost: Joi.number().min(0).default(0),
  material_markup_pct: Joi.number().min(0).max(500).default(25),
  labor_hours: Joi.number().min(0).max(1000).default(0),
  hourly_rate_override: Joi.number().min(0).allow(null).default(null),
  quantity: Joi.number().integer().min(1).max(999).default(1),
});

const createJobSchema = Joi.object({
  job_name: Joi.string().trim().min(1).max(200).required(),
  customer_name: Joi.string().trim().max(200).allow('').default(''),
  status: Joi.string().valid('draft', 'sent', 'accepted', 'completed', 'cancelled').default('draft'),
  line_items: Joi.array().items(lineItemSchema).max(100).default([]),
  notes: Joi.string().trim().max(2000).allow('').default(''),
});

const updateJobSchema = Joi.object({
  job_name: Joi.string().trim().min(1).max(200),
  customer_name: Joi.string().trim().max(200).allow(''),
  status: Joi.string().valid('draft', 'sent', 'accepted', 'completed', 'cancelled'),
  line_items: Joi.array().items(lineItemSchema).max(100),
  notes: Joi.string().trim().max(2000).allow(''),
}).min(1);

module.exports = { createJobSchema, updateJobSchema, lineItemSchema };
