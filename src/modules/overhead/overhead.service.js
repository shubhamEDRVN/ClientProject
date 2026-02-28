const Overhead = require('./overhead.model');
const { calculateOverhead } = require('../../core/financialEngine');
const ApiError = require('../../utils/ApiError');

/**
 * Upsert overhead inputs for a user/company pair.
 * @param {string} userId
 * @param {string} companyId
 * @param {Object} data - validated overhead fields
 * @returns {Promise<Object>} saved overhead document
 */
const saveOverhead = async (userId, companyId, data) => {
  const overhead = await Overhead.findOneAndUpdate(
    { userId, companyId },
    { $set: { ...data, userId, companyId } },
    { new: true, upsert: true, runValidators: true }
  );
  return overhead;
};

/**
 * Retrieve the overhead inputs for a user/company pair.
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Object>} overhead document or null
 */
const getOverhead = async (userId, companyId) => {
  const overhead = await Overhead.findOne({ userId, companyId });
  if (!overhead) {
    throw ApiError.notFound('No overhead data found. Please save your overhead inputs first.');
  }
  return overhead;
};

/**
 * Get overhead inputs AND run calculations.
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<{ inputs: Object, calculations: Object }>}
 */
const getCalculations = async (userId, companyId) => {
  const overhead = await Overhead.findOne({ userId, companyId });
  const inputs = overhead ? overhead.toObject() : {};
  const calculations = calculateOverhead(inputs);
  return { inputs, calculations };
};

module.exports = { saveOverhead, getOverhead, getCalculations };
