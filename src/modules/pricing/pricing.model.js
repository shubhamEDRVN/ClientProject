const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['hvac', 'plumbing', 'electrical', 'general'],
    default: 'general',
  },
  description: { type: String, default: '', trim: true },
  material_cost: { type: Number, default: 0, min: 0 },
  material_margin_pct: { type: Number, default: 50, min: 0, max: 99 },
  labor_hours: { type: Number, default: 1, min: 0 },
  // hourly_rate is fetched from overhead at calculation time; user can also override per-item
  hourly_rate_override: { type: Number, default: null },
});

const pricingMatrixSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    services: [serviceItemSchema],
    // Global default margin % applied to new items
    default_margin_pct: { type: Number, default: 50, min: 0, max: 99 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PricingMatrix', pricingMatrixSchema);
