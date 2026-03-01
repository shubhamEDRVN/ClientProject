const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['hvac', 'plumbing', 'electrical', 'general'],
    default: 'general',
  },
  description: { type: String, default: '', trim: true },
  material_cost: { type: Number, default: 0, min: 0 },
  material_markup_pct: { type: Number, default: 25, min: 0 },
  labor_hours: { type: Number, default: 0, min: 0 },
  hourly_rate_override: { type: Number, default: null },
  quantity: { type: Number, default: 1, min: 1 },
});

const jobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    job_name: { type: String, required: true, trim: true },
    customer_name: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'completed', 'cancelled'],
      default: 'draft',
    },
    line_items: [lineItemSchema],
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

// Index for efficient querying per company
jobSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
