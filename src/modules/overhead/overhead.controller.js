const { saveOverheadSchema } = require('./overhead.validation');
const overheadService = require('./overhead.service');
const { calculateOverhead } = require('../../core/financialEngine');
const { successResponse } = require('../../utils/apiResponse');

/**
 * POST /api/overhead/save
 * Validates input, saves/updates overhead, returns inputs + calculations.
 */
const save = async (req, res, next) => {
  try {
    const { error, value } = saveOverheadSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(require('../../utils/ApiError').badRequest(message));
    }

    const { userId, companyId } = req.user;
    const saved = await overheadService.saveOverhead(userId, companyId, value);
    const calculations = calculateOverhead(saved.toObject());

    return successResponse(res, 200, 'Overhead saved successfully.', {
      inputs: saved,
      calculations,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/overhead
 * Returns saved overhead inputs.
 */
const get = async (req, res, next) => {
  try {
    const { userId, companyId } = req.user;
    const overhead = await overheadService.getOverhead(userId, companyId);
    return successResponse(res, 200, 'Overhead data retrieved.', { inputs: overhead });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/overhead/calculations
 * Returns saved overhead inputs AND all calculated results.
 */
const getCalculations = async (req, res, next) => {
  try {
    const { userId, companyId } = req.user;
    const result = await overheadService.getCalculations(userId, companyId);
    return successResponse(res, 200, 'Overhead calculations retrieved.', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { save, get, getCalculations };
