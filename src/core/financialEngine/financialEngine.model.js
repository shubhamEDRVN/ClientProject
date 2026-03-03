const mongoose = require('mongoose');

const jobSummarySchema = new mongoose.Schema(
  {
    total_jobs: { type: Number, default: 0 },
    total_revenue: { type: Number, default: 0 },
    total_material_cost: { type: Number, default: 0 },
    total_labor_hours: { type: Number, default: 0 },
    total_profit: { type: Number, default: 0 },
    overall_margin_pct: { type: Number, default: 0 },
    jobs_by_status: {
      draft: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      accepted: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const overheadSummarySchema = new mongoose.Schema(
  {
    total_annual_overhead: { type: Number, default: 0 },
    billable_hourly_rate: { type: Number, default: 0 },
    revenue_target: { type: Number, default: 0 },
    total_billable_hours: { type: Number, default: 0 },
  },
  { _id: false }
);

const financialSnapshotSchema = new mongoose.Schema(
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
    snapshot_name: {
      type: String,
      required: [true, 'Snapshot name is required'],
      trim: true,
    },
    period_start: { type: Date, required: true },
    period_end: { type: Date, required: true },
    snapshot_type: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', 'custom'],
      default: 'custom',
    },
    overhead_summary: { type: overheadSummarySchema, default: () => ({}) },
    job_summary: { type: jobSummarySchema, default: () => ({}) },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

financialSnapshotSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('FinancialSnapshot', financialSnapshotSchema);
