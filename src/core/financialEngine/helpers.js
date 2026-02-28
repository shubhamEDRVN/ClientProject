const Decimal = require('decimal.js');

/**
 * Converts any number/string to Decimal, defaults to 0 if invalid.
 * @param {*} value
 * @returns {Decimal}
 */
const toDecimal = (value) => {
  try {
    const d = new Decimal(value ?? 0);
    return d.isNaN() ? new Decimal(0) : d;
  } catch {
    return new Decimal(0);
  }
};

/**
 * Safe division — returns defaultValue if denominator is 0.
 * @param {Decimal|number|string} numerator
 * @param {Decimal|number|string} denominator
 * @param {number} defaultValue
 * @returns {Decimal}
 */
const safeDivide = (numerator, denominator, defaultValue = 0) => {
  const den = toDecimal(denominator);
  if (den.isZero()) return toDecimal(defaultValue);
  return toDecimal(numerator).div(den);
};

/**
 * Rounds a Decimal to 2 decimal places (cents).
 * @param {Decimal} decimal
 * @returns {Decimal}
 */
const roundToCents = (decimal) => {
  return toDecimal(decimal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
};

/**
 * Calculates (part / whole) * 100, rounded to 2 decimals.
 * @param {Decimal|number|string} part
 * @param {Decimal|number|string} whole
 * @returns {Decimal}
 */
const toPercentage = (part, whole) => {
  return roundToCents(safeDivide(toDecimal(part).times(100), whole));
};

/**
 * Sums an array of numbers using decimal.js.
 * @param {Array<number|string|Decimal>} arrayOfNumbers
 * @returns {Decimal}
 */
const sumValues = (arrayOfNumbers) => {
  return arrayOfNumbers.reduce((acc, val) => acc.plus(toDecimal(val)), new Decimal(0));
};

module.exports = { toDecimal, safeDivide, roundToCents, toPercentage, sumValues };
