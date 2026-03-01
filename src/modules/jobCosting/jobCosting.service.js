const Decimal = require('decimal.js');
const Job = require('./jobCosting.model');
const OverheadInput = require('../overhead/overhead.model');
const { calculateResults: calcOverhead } = require('../overhead/overhead.service');
const ApiError = require('../../utils/ApiError');

/**
 * Get the user's billable hourly rate from their overhead data.
 * Returns 0 if no overhead record exists yet.
 */
const getHourlyRate = async (userId) => {
  const record = await OverheadInput.findOne({ userId });
  if (!record) return 0;
  const calc = calcOverhead(record.toObject());
  return calc.finalBillableHourlyRate || 0;
};

/**
 * Calculate derived costing fields for every line item in a job.
 */
const calculateLineItems = (lineItems, fallbackRate) => {
  return lineItems.map((item) => {
    const materialCost = new Decimal(item.material_cost || 0);
    const markupPct = new Decimal(item.material_markup_pct ?? 25);
    const laborHours = new Decimal(item.labor_hours || 0);
    const rate = new Decimal(item.hourly_rate_override ?? fallbackRate);
    const quantity = new Decimal(item.quantity || 1);

    const materialPrice = materialCost.times(new Decimal(1).plus(markupPct.dividedBy(100)));
    const laborPrice = laborHours.times(rate);
    const unitPrice = materialPrice.plus(laborPrice);
    const lineTotal = unitPrice.times(quantity);
    const lineCost = materialCost.times(quantity);
    const lineProfit = lineTotal.minus(lineCost);
    const marginPct = lineTotal.isZero()
      ? new Decimal(0)
      : lineProfit.dividedBy(lineTotal).times(100);

    return {
      _id: item._id,
      name: item.name,
      category: item.category,
      description: item.description,
      material_cost: materialCost.toDecimalPlaces(2).toNumber(),
      material_markup_pct: markupPct.toDecimalPlaces(2).toNumber(),
      labor_hours: laborHours.toDecimalPlaces(2).toNumber(),
      hourly_rate_override: item.hourly_rate_override,
      quantity: quantity.toNumber(),
      // Calculated
      hourly_rate_used: rate.toDecimalPlaces(2).toNumber(),
      material_price: materialPrice.toDecimalPlaces(2).toNumber(),
      labor_price: laborPrice.toDecimalPlaces(2).toNumber(),
      unit_price: unitPrice.toDecimalPlaces(2).toNumber(),
      line_total: lineTotal.toDecimalPlaces(2).toNumber(),
      line_cost: lineCost.toDecimalPlaces(2).toNumber(),
      line_profit: lineProfit.toDecimalPlaces(2).toNumber(),
      margin_pct: marginPct.toDecimalPlaces(2).toNumber(),
    };
  });
};

/**
 * Calculate job-level totals from calculated line items.
 */
const calculateJobTotals = (calculatedItems) => {
  const totals = calculatedItems.reduce(
    (acc, item) => ({
      total_materials: acc.total_materials.plus(new Decimal(item.line_cost)),
      total_revenue: acc.total_revenue.plus(new Decimal(item.line_total)),
      total_labor_hours: acc.total_labor_hours.plus(
        new Decimal(item.labor_hours).times(new Decimal(item.quantity))
      ),
    }),
    {
      total_materials: new Decimal(0),
      total_revenue: new Decimal(0),
      total_labor_hours: new Decimal(0),
    }
  );

  const totalProfit = totals.total_revenue.minus(totals.total_materials);
  const overallMargin = totals.total_revenue.isZero()
    ? new Decimal(0)
    : totalProfit.dividedBy(totals.total_revenue).times(100);

  return {
    total_materials: totals.total_materials.toDecimalPlaces(2).toNumber(),
    total_revenue: totals.total_revenue.toDecimalPlaces(2).toNumber(),
    total_profit: totalProfit.toDecimalPlaces(2).toNumber(),
    total_labor_hours: totals.total_labor_hours.toDecimalPlaces(2).toNumber(),
    overall_margin_pct: overallMargin.toDecimalPlaces(2).toNumber(),
    line_item_count: calculatedItems.length,
  };
};

const createJob = async (userId, companyId, data) => {
  const job = await Job.create({ ...data, userId, companyId });
  const hourlyRate = await getHourlyRate(userId);
  const calculatedItems = calculateLineItems(job.line_items, hourlyRate);
  const totals = calculateJobTotals(calculatedItems);
  return { job, calculations: calculatedItems, totals, hourlyRate };
};

const getJobs = async (companyId) => {
  const jobs = await Job.find({ companyId }).sort({ createdAt: -1 }).lean();
  return jobs;
};

const getJobById = async (jobId, companyId, userId) => {
  const job = await Job.findOne({ _id: jobId, companyId });
  if (!job) {
    throw ApiError.notFound('Job not found');
  }
  const hourlyRate = await getHourlyRate(userId);
  const calculatedItems = calculateLineItems(job.line_items, hourlyRate);
  const totals = calculateJobTotals(calculatedItems);
  return { job, calculations: calculatedItems, totals, hourlyRate };
};

const updateJob = async (jobId, companyId, userId, data) => {
  const job = await Job.findOneAndUpdate(
    { _id: jobId, companyId },
    data,
    { new: true, runValidators: true }
  );
  if (!job) {
    throw ApiError.notFound('Job not found');
  }
  const hourlyRate = await getHourlyRate(userId);
  const calculatedItems = calculateLineItems(job.line_items, hourlyRate);
  const totals = calculateJobTotals(calculatedItems);
  return { job, calculations: calculatedItems, totals, hourlyRate };
};

const deleteJob = async (jobId, companyId) => {
  const job = await Job.findOneAndDelete({ _id: jobId, companyId });
  if (!job) {
    throw ApiError.notFound('Job not found');
  }
  return job;
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  calculateLineItems,
  calculateJobTotals,
};
