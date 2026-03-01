const mongoose = require('mongoose');

const overheadInputSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Company Overhead (Annual costs)
    owner_salary: { type: Number, default: 0 },
    office_staff_1: { type: Number, default: 0 },
    office_staff_2: { type: Number, default: 0 },
    office_staff_3: { type: Number, default: 0 },
    fuel: { type: Number, default: 0 },
    vehicle_maintenance: { type: Number, default: 0 },
    truck_1: { type: Number, default: 0 },
    truck_2: { type: Number, default: 0 },
    truck_3: { type: Number, default: 0 },
    loan_payments: { type: Number, default: 0 },
    workers_comp: { type: Number, default: 0 },
    liability_insurance: { type: Number, default: 0 },
    merchant_fees: { type: Number, default: 0 },
    shop_rent: { type: Number, default: 0 },
    cellular: { type: Number, default: 0 },
    accounting: { type: Number, default: 0 },
    software_subs: { type: Number, default: 0 },
    marketing: { type: Number, default: 0 },
    training: { type: Number, default: 0 },
    uniforms: { type: Number, default: 0 },
    tools: { type: Number, default: 0 },
    payroll_processing: { type: Number, default: 0 },
    auto_insurance: { type: Number, default: 0 },
    licenses: { type: Number, default: 0 },
    misc: { type: Number, default: 0 },
    // Tech salaries (not included in overhead sum for hourly rate calc)
    highest_tech_salary: { type: Number, default: 0 },
    helper_salary: { type: Number, default: 0 },
    // Operational Inputs
    num_trucks: { type: Number, default: 1, min: 1 },
    working_days_per_year: { type: Number, default: 125 },
    avg_hours_per_day: { type: Number, default: 8 },
    // For overhead % calculation
    total_revenue_last_year: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OverheadInput', overheadInputSchema);
