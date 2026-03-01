const Decimal = require('decimal.js');
const PricingMatrix = require('./pricing.model');
const OverheadInput = require('../overhead/overhead.model');
const { calculateResults: calcOverhead } = require('../overhead/overhead.service');

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
 * Calculate derived pricing fields for every service item.
 */
const calculateServicePricing = (services, fallbackRate) => {
  return services.map((svc) => {
    const materialCost = new Decimal(svc.material_cost || 0);
    const markupPct = new Decimal(svc.material_markup_pct ?? 25);
    const laborHours = new Decimal(svc.labor_hours || 0);
    const rate = new Decimal(svc.hourly_rate_override ?? fallbackRate);

    const materialPrice = materialCost.times(new Decimal(1).plus(markupPct.dividedBy(100)));
    const laborPrice = laborHours.times(rate);
    const totalPrice = materialPrice.plus(laborPrice);
    const grossProfit = totalPrice.minus(materialCost);
    const marginPct = totalPrice.isZero()
      ? new Decimal(0)
      : grossProfit.dividedBy(totalPrice).times(100);

    return {
      _id: svc._id,
      name: svc.name,
      category: svc.category,
      description: svc.description,
      material_cost: materialCost.toDecimalPlaces(2).toNumber(),
      material_markup_pct: markupPct.toDecimalPlaces(2).toNumber(),
      labor_hours: laborHours.toDecimalPlaces(2).toNumber(),
      hourly_rate_override: svc.hourly_rate_override,
      // Calculated
      hourly_rate_used: rate.toDecimalPlaces(2).toNumber(),
      material_price: materialPrice.toDecimalPlaces(2).toNumber(),
      labor_price: laborPrice.toDecimalPlaces(2).toNumber(),
      total_price: totalPrice.toDecimalPlaces(2).toNumber(),
      gross_profit: grossProfit.toDecimalPlaces(2).toNumber(),
      margin_pct: marginPct.toDecimalPlaces(2).toNumber(),
    };
  });
};

const savePricingMatrix = async (userId, data) => {
  const record = await PricingMatrix.findOneAndUpdate(
    { userId },
    { ...data, userId },
    { new: true, upsert: true, runValidators: true }
  );
  const hourlyRate = await getHourlyRate(userId);
  const calculations = calculateServicePricing(record.services, hourlyRate);
  return { inputs: record, calculations, hourlyRate };
};

const getPricingMatrix = async (userId) => {
  const record = await PricingMatrix.findOne({ userId });
  const hourlyRate = await getHourlyRate(userId);
  if (!record) {
    return { inputs: null, calculations: [], hourlyRate };
  }
  const calculations = calculateServicePricing(record.services, hourlyRate);
  return { inputs: record, calculations, hourlyRate };
};

module.exports = { savePricingMatrix, getPricingMatrix, calculateServicePricing };
