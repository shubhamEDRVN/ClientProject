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
  material_markup_pct: { type: Number, default: 25, min: 0 },
  labor_hours: { type: Number, default: 1, min: 0 },
  // hourly_rate is fetched from overhead at calculation time; user can also override per-item
  hourly_rate_override: { type: Number, default: null, min: 0 },
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
    // Global default markup % applied to new items
    default_markup_pct: { type: Number, default: 25, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PricingMatrix', pricingMatrixSchema);
