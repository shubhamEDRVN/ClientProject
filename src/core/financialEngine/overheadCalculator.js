const { toDecimal, safeDivide, roundToCents, toPercentage, sumValues } = require('./helpers');

/**
 * Calculates all overhead and hourly rate figures from the given inputs.
 * Pure function — no DB calls, no side effects.
 *
 * @param {Object} inputs - All overhead fields plus operational settings.
 * @returns {Object} Calculated results (all values as strings via toFixed(2)).
 */
const calculateOverhead = (inputs = {}) => {
  const {
    ownerSalary = 0,
    officeStaff1 = 0,
    officeStaff2 = 0,
    officeStaff3 = 0,
    fuel = 0,
    vehicleMaintenance = 0,
    truck1 = 0,
    truck2 = 0,
    truck3 = 0,
    loanPayments = 0,
    workersComp = 0,
    liabilityInsurance = 0,
    merchantFees = 0,
    shopRent = 0,
    cellular = 0,
    accounting = 0,
    softwareSubs = 0,
    marketing = 0,
    training = 0,
    uniforms = 0,
    tools = 0,
    payrollProcessing = 0,
    autoInsurance = 0,
    licenses = 0,
    misc = 0,
    highestTechSalary = 0,
    helperSalary = 0,
    numTrucks = 1,
    workingDaysPerYear = 125,
    avgHoursPerDay = 8,
    totalRevenueLastYear = 0,
  } = inputs;

  // Step 1: Total Annual Overhead (excludes tech/helper salaries)
  const totalAnnualOverhead = sumValues([
    ownerSalary, officeStaff1, officeStaff2, officeStaff3,
    fuel, vehicleMaintenance, truck1, truck2, truck3,
    loanPayments, workersComp, liabilityInsurance,
    merchantFees, shopRent, cellular, accounting,
    softwareSubs, marketing, training, uniforms,
    tools, payrollProcessing, autoInsurance, licenses, misc,
  ]);

  // Step 2: Total Billable Hours = numTrucks × workingDaysPerYear × avgHoursPerDay
  const numTrucksD = toDecimal(numTrucks);
  const workingDaysD = toDecimal(workingDaysPerYear);
  const avgHoursD = toDecimal(avgHoursPerDay);
  const totalBillableHours = numTrucksD.times(workingDaysD).times(avgHoursD);

  // Step 5: Billable Hours Per Truck = workingDaysPerYear × avgHoursPerDay
  const billableHoursPerTruck = workingDaysD.times(avgHoursD);

  // Step 3: Revenue Target = Total Annual Overhead ÷ 0.50
  const revenueTarget = safeDivide(totalAnnualOverhead, 0.50);

  // Step 4: Overhead Hourly Rate = Revenue Target ÷ Total Billable Hours
  const overheadHourlyRate = safeDivide(revenueTarget, totalBillableHours);

  // Step 6: Tech Hourly Add-on = highestTechSalary ÷ Billable Hours Per Truck
  const techHourlyAddon = safeDivide(toDecimal(highestTechSalary), billableHoursPerTruck);

  // Step 7: Helper Hourly Add-on = helperSalary ÷ Billable Hours Per Truck (if > 0)
  const helperSalaryD = toDecimal(helperSalary);
  const helperHourlyAddon = helperSalaryD.isZero()
    ? toDecimal(0)
    : safeDivide(helperSalaryD, billableHoursPerTruck);

  // Step 8: Final Billable Hourly Rate = Overhead Rate + Tech Add-on + Helper Add-on
  const finalBillableHourlyRate = roundToCents(
    overheadHourlyRate.plus(techHourlyAddon).plus(helperHourlyAddon)
  );

  // Step 9: Est. Yearly Gross Revenue = Final Rate × Total Billable Hours
  const estYearlyGrossRevenue = roundToCents(finalBillableHourlyRate.times(totalBillableHours));

  // Step 10: Annual Amount Per Service Truck = Est. Yearly Gross ÷ numTrucks
  const annualPerTruck = roundToCents(safeDivide(estYearlyGrossRevenue, numTrucksD));

  // Step 11: Daily Revenue Needed (Total) = Est. Yearly Gross ÷ workingDaysPerYear
  const dailyRevenueTotal = roundToCents(safeDivide(estYearlyGrossRevenue, workingDaysD));

  // Step 12: Daily Revenue Needed Per Truck = Daily Revenue ÷ numTrucks
  const dailyRevenuePerTruck = roundToCents(safeDivide(dailyRevenueTotal, numTrucksD));

  // Step 13: Overhead % of Last Year Revenue
  const revenueLastYearD = toDecimal(totalRevenueLastYear);
  const overheadPercentOfLastYear = revenueLastYearD.isZero()
    ? toDecimal(0)
    : toPercentage(totalAnnualOverhead, revenueLastYearD);

  return {
    totalAnnualOverhead: roundToCents(totalAnnualOverhead).toFixed(2),
    totalBillableHours: totalBillableHours.toFixed(2),
    revenueTarget: roundToCents(revenueTarget).toFixed(2),
    overheadHourlyRate: roundToCents(overheadHourlyRate).toFixed(2),
    techHourlyAddon: roundToCents(techHourlyAddon).toFixed(2),
    helperHourlyAddon: roundToCents(helperHourlyAddon).toFixed(2),
    finalBillableHourlyRate: finalBillableHourlyRate.toFixed(2),
    estYearlyGrossRevenue: estYearlyGrossRevenue.toFixed(2),
    annualPerTruck: annualPerTruck.toFixed(2),
    dailyRevenueTotal: dailyRevenueTotal.toFixed(2),
    dailyRevenuePerTruck: dailyRevenuePerTruck.toFixed(2),
    overheadPercentOfLastYear: overheadPercentOfLastYear.toFixed(2),
    billableHoursPerTruck: billableHoursPerTruck.toFixed(2),
  };
};

module.exports = { calculateOverhead };
