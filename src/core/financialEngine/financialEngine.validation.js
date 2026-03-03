const Joi = require('joi');

const createSnapshotSchema = Joi.object({
  snapshot_name: Joi.string().trim().min(1).max(200).required(),
  period_start: Joi.date().iso().required(),
  period_end: Joi.date().iso().greater(Joi.ref('period_start')).required(),
  snapshot_type: Joi.string()
    .valid('monthly', 'quarterly', 'annual', 'custom')
    .default('custom'),
  notes: Joi.string().trim().max(2000).allow('').default(''),
});

const reportQuerySchema = Joi.object({
  period_start: Joi.date().iso().optional(),
  period_end: Joi.date().iso().optional(),
});

module.exports = { createSnapshotSchema, reportQuerySchema };
