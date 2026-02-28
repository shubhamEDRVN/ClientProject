const Joi = require('joi');

const monetaryField = Joi.number().min(0).default(0);

const saveOverheadSchema = Joi.object({
  // Personnel Costs
  ownerSalary: monetaryField,
  officeStaff1: monetaryField,
  officeStaff2: monetaryField,
  officeStaff3: monetaryField,

  // Vehicle & Equipment
  fuel: monetaryField,
  vehicleMaintenance: monetaryField,
  truck1: monetaryField,
  truck2: monetaryField,
  truck3: monetaryField,

  // Insurance & Financial
  loanPayments: monetaryField,
  workersComp: monetaryField,
  liabilityInsurance: monetaryField,
  merchantFees: monetaryField,
  autoInsurance: monetaryField,

  // Facilities & Operations
  shopRent: monetaryField,
  cellular: monetaryField,
  accounting: monetaryField,
  softwareSubs: monetaryField,

  // Growth & Maintenance
  marketing: monetaryField,
  training: monetaryField,
  uniforms: monetaryField,
  tools: monetaryField,
  payrollProcessing: monetaryField,
  licenses: monetaryField,
  misc: monetaryField,

  // Technician Costs
  highestTechSalary: monetaryField,
  helperSalary: monetaryField,

  // Operational Settings
  numTrucks: Joi.number().integer().min(1).default(1),
  workingDaysPerYear: Joi.number().integer().min(1).max(365).default(125),
  avgHoursPerDay: Joi.number().min(1).max(24).default(8),
  totalRevenueLastYear: monetaryField,
});

module.exports = { saveOverheadSchema };
