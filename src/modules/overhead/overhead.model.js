const mongoose = require('mongoose');

const { Schema, Types } = mongoose;

const overheadSchema = new Schema(
  {
    companyId: { type: Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true },

    // 25 Overhead Line Items (annual $, all default 0)
    ownerSalary: { type: Number, default: 0 },
    officeStaff1: { type: Number, default: 0 },
    officeStaff2: { type: Number, default: 0 },
    officeStaff3: { type: Number, default: 0 },
    fuel: { type: Number, default: 0 },
    vehicleMaintenance: { type: Number, default: 0 },
    truck1: { type: Number, default: 0 },
    truck2: { type: Number, default: 0 },
    truck3: { type: Number, default: 0 },
    loanPayments: { type: Number, default: 0 },
    workersComp: { type: Number, default: 0 },
    liabilityInsurance: { type: Number, default: 0 },
    merchantFees: { type: Number, default: 0 },
    shopRent: { type: Number, default: 0 },
    cellular: { type: Number, default: 0 },
    accounting: { type: Number, default: 0 },
    softwareSubs: { type: Number, default: 0 },
    marketing: { type: Number, default: 0 },
    training: { type: Number, default: 0 },
    uniforms: { type: Number, default: 0 },
    tools: { type: Number, default: 0 },
    payrollProcessing: { type: Number, default: 0 },
    autoInsurance: { type: Number, default: 0 },
    licenses: { type: Number, default: 0 },
    misc: { type: Number, default: 0 },

    // Tech salaries (separate from overhead sum)
    highestTechSalary: { type: Number, default: 0 },
    helperSalary: { type: Number, default: 0 },

    // Operational Inputs
    numTrucks: { type: Number, default: 1, min: 1 },
    workingDaysPerYear: { type: Number, default: 125 },
    avgHoursPerDay: { type: Number, default: 8 },
    totalRevenueLastYear: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One overhead record per user per company
overheadSchema.index({ companyId: 1, userId: 1 }, { unique: true });

const Overhead = mongoose.model('Overhead', overheadSchema);

module.exports = Overhead;
