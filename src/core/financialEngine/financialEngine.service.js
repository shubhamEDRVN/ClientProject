const Decimal = require('decimal.js');
const FinancialSnapshot = require('./financialEngine.model');
const Job = require('../../modules/jobCosting/jobCosting.model');
const OverheadInput = require('../../modules/overhead/overhead.model');
const { calculateResults: calcOverhead } = require('../../modules/overhead/overhead.service');
const { calculateLineItems, calculateJobTotals } = require('../../modules/jobCosting/jobCosting.service');
const ApiError = require('../../utils/ApiError');

/**
 * Build overhead summary from the user's current overhead data.
 */
const buildOverheadSummary = async (userId) => {
  const record = await OverheadInput.findOne({ userId });
  if (!record) {
    return {
      total_annual_overhead: 0,
      billable_hourly_rate: 0,
      revenue_target: 0,
      total_billable_hours: 0,
    };
  }
  const calc = calcOverhead(record.toObject());
  return {
    total_annual_overhead: calc.totalAnnualOverhead,
    billable_hourly_rate: calc.finalBillableHourlyRate,
    revenue_target: calc.revenueTarget,
    total_billable_hours: calc.totalBillableHours,
  };
};

/**
 * Build job summary by aggregating all jobs for a company within an optional date range.
 * Jobs are filtered by createdAt since the Job model does not have a dedicated job date field.
 */
const buildJobSummary = async (companyId, userId, periodStart, periodEnd) => {
  const query = { companyId };
  if (periodStart || periodEnd) {
    query.createdAt = {};
    if (periodStart) query.createdAt.$gte = new Date(periodStart);
    if (periodEnd) query.createdAt.$lte = new Date(periodEnd);
  }

  const jobs = await Job.find(query).lean();

  const overheadRecord = await OverheadInput.findOne({ userId });
  const hourlyRate = overheadRecord
    ? calcOverhead(overheadRecord.toObject()).finalBillableHourlyRate || 0
    : 0;

  const statusCounts = { draft: 0, sent: 0, accepted: 0, completed: 0, cancelled: 0 };
  let totalRevenue = new Decimal(0);
  let totalMaterialCost = new Decimal(0);
  let totalLaborHours = new Decimal(0);

  for (const job of jobs) {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    const calculatedItems = calculateLineItems(job.line_items, hourlyRate);
    const totals = calculateJobTotals(calculatedItems);
    totalRevenue = totalRevenue.plus(new Decimal(totals.total_revenue));
    totalMaterialCost = totalMaterialCost.plus(new Decimal(totals.total_material_cost));
    totalLaborHours = totalLaborHours.plus(new Decimal(totals.total_labor_hours));
  }

  const totalProfit = totalRevenue.minus(totalMaterialCost);
  const overallMargin = totalRevenue.isZero()
    ? new Decimal(0)
    : totalProfit.dividedBy(totalRevenue).times(100);

  return {
    total_jobs: jobs.length,
    total_revenue: totalRevenue.toDecimalPlaces(2).toNumber(),
    total_material_cost: totalMaterialCost.toDecimalPlaces(2).toNumber(),
    total_labor_hours: totalLaborHours.toDecimalPlaces(2).toNumber(),
    total_profit: totalProfit.toDecimalPlaces(2).toNumber(),
    overall_margin_pct: overallMargin.toDecimalPlaces(2).toNumber(),
    jobs_by_status: statusCounts,
  };
};

/**
 * Generate a live financial report (not persisted).
 */
const generateReport = async (userId, companyId, periodStart, periodEnd) => {
  const overheadSummary = await buildOverheadSummary(userId);
  const jobSummary = await buildJobSummary(companyId, userId, periodStart, periodEnd);

  return { overhead_summary: overheadSummary, job_summary: jobSummary };
};

/**
 * Create and persist a financial snapshot.
 */
const createSnapshot = async (userId, companyId, data) => {
  const overheadSummary = await buildOverheadSummary(userId);
  const jobSummary = await buildJobSummary(companyId, userId, data.period_start, data.period_end);

  const snapshot = await FinancialSnapshot.create({
    userId,
    companyId,
    snapshot_name: data.snapshot_name,
    period_start: data.period_start,
    period_end: data.period_end,
    snapshot_type: data.snapshot_type,
    overhead_summary: overheadSummary,
    job_summary: jobSummary,
    notes: data.notes,
  });

  return snapshot;
};

/**
 * List all snapshots for a company.
 */
const getSnapshots = async (companyId) => {
  return FinancialSnapshot.find({ companyId }).sort({ createdAt: -1 }).lean();
};

/**
 * Get a single snapshot by ID.
 */
const getSnapshotById = async (snapshotId, companyId) => {
  const snapshot = await FinancialSnapshot.findOne({ _id: snapshotId, companyId });
  if (!snapshot) {
    throw ApiError.notFound('Financial snapshot not found');
  }
  return snapshot;
};

/**
 * Delete a snapshot by ID.
 */
const deleteSnapshot = async (snapshotId, companyId) => {
  const snapshot = await FinancialSnapshot.findOneAndDelete({ _id: snapshotId, companyId });
  if (!snapshot) {
    throw ApiError.notFound('Financial snapshot not found');
  }
  return snapshot;
};

module.exports = {
  generateReport,
  createSnapshot,
  getSnapshots,
  getSnapshotById,
  deleteSnapshot,
  buildOverheadSummary,
  buildJobSummary,
};
