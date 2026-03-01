const Decimal = require('decimal.js');
const OverheadInput = require('./overhead.model');
const ApiError = require('../../utils/ApiError');

// All overhead line items that sum into total annual overhead
const OVERHEAD_FIELDS = [
  'owner_salary', 'office_staff_1', 'office_staff_2', 'office_staff_3',
  'fuel', 'vehicle_maintenance', 'truck_1', 'truck_2', 'truck_3',
  'loan_payments', 'workers_comp', 'liability_insurance',
  'merchant_fees', 'shop_rent', 'cellular', 'accounting',
  'software_subs', 'marketing', 'training', 'uniforms',
  'tools', 'payroll_processing', 'auto_insurance', 'licenses', 'misc',
];

const calculateResults = (inputs) => {
  // Use Decimal.js for precise financial calculations
  const totalAnnualOverhead = OVERHEAD_FIELDS.reduce(
    (sum, field) => sum.plus(new Decimal(inputs[field] || 0)),
    new Decimal(0)
  );

  const numTrucks = new Decimal(inputs.num_trucks || 1);
  const workingDays = new Decimal(inputs.working_days_per_year || 125);
  const avgHours = new Decimal(inputs.avg_hours_per_day || 8);
  const highestTechSalary = new Decimal(inputs.highest_tech_salary || 0);
  const totalRevLastYear = new Decimal(inputs.total_revenue_last_year || 0);

  // Total Billable Hours = trucks × days × hours
  const totalBillableHours = numTrucks.times(workingDays).times(avgHours);

  // Billable hours per truck
  const billableHoursPerTruck = workingDays.times(avgHours);

  // Revenue Target = overhead / 0.50 (50% margin)
  const revenueTarget = totalBillableHours.isZero()
    ? new Decimal(0)
    : totalAnnualOverhead.dividedBy(new Decimal('0.50'));

  // Overhead Hourly Rate = Revenue Target / Total Billable Hours
  const overheadHourlyRate = totalBillableHours.isZero()
    ? new Decimal(0)
    : revenueTarget.dividedBy(totalBillableHours);

  // Tech Hourly Add-on = Highest Tech Salary / Billable Hours Per Truck
  const techHourlyAddon = billableHoursPerTruck.isZero()
    ? new Decimal(0)
    : highestTechSalary.dividedBy(billableHoursPerTruck);

  // Final Billable Hourly Rate
  const finalBillableHourlyRate = overheadHourlyRate.plus(techHourlyAddon);

  // Est. Yearly Gross Revenue
  const estYearlyGross = finalBillableHourlyRate.times(totalBillableHours);

  // Annual Amount Per Service Truck
  const annualPerTruck = numTrucks.isZero()
    ? new Decimal(0)
    : estYearlyGross.dividedBy(numTrucks);

  // Daily Revenue Needed (Total Company)
  const dailyRevenueTotal = workingDays.isZero()
    ? new Decimal(0)
    : estYearlyGross.dividedBy(workingDays);

  // Daily Revenue Needed Per Truck
  const dailyRevenuePerTruck = numTrucks.isZero()
    ? new Decimal(0)
    : dailyRevenueTotal.dividedBy(numTrucks);

  // Overhead % of Last Year Revenue
  const overheadPctOfRevenue = totalRevLastYear.isZero()
    ? new Decimal(0)
    : totalAnnualOverhead.dividedBy(totalRevLastYear).times(100);

  return {
    totalAnnualOverhead: totalAnnualOverhead.toDecimalPlaces(2).toNumber(),
    totalBillableHours: totalBillableHours.toDecimalPlaces(2).toNumber(),
    billableHoursPerTruck: billableHoursPerTruck.toDecimalPlaces(2).toNumber(),
    revenueTarget: revenueTarget.toDecimalPlaces(2).toNumber(),
    overheadHourlyRate: overheadHourlyRate.toDecimalPlaces(2).toNumber(),
    techHourlyAddon: techHourlyAddon.toDecimalPlaces(2).toNumber(),
    finalBillableHourlyRate: finalBillableHourlyRate.toDecimalPlaces(2).toNumber(),
    estYearlyGross: estYearlyGross.toDecimalPlaces(2).toNumber(),
    annualPerTruck: annualPerTruck.toDecimalPlaces(2).toNumber(),
    dailyRevenueTotal: dailyRevenueTotal.toDecimalPlaces(2).toNumber(),
    dailyRevenuePerTruck: dailyRevenuePerTruck.toDecimalPlaces(2).toNumber(),
    overheadPctOfRevenue: overheadPctOfRevenue.toDecimalPlaces(2).toNumber(),
  };
};

const saveOverhead = async (userId, data) => {
  const record = await OverheadInput.findOneAndUpdate(
    { userId },
    { ...data, userId },
    { new: true, upsert: true, runValidators: true }
  );
  const calculations = calculateResults(record.toObject());
  return { inputs: record, calculations };
};

const getOverhead = async (userId) => {
  const record = await OverheadInput.findOne({ userId });
  if (!record) {
    return { inputs: null, calculations: null };
  }
  const calculations = calculateResults(record.toObject());
  return { inputs: record, calculations };
};

module.exports = { saveOverhead, getOverhead, calculateResults, OVERHEAD_FIELDS };
