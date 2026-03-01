const overheadService = require('./overhead.service');
const { overheadSchema } = require('./overhead.validation');
const { successResponse } = require('../../utils/apiResponse');
const ApiError = require('../../utils/ApiError');

const saveOverhead = async (req, res, next) => {
  try {
    const { error, value } = overheadSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const result = await overheadService.saveOverhead(req.user.userId, value);
    return successResponse(res, 200, 'Overhead data saved successfully', result);
  } catch (err) {
    next(err);
  }
};

const getOverhead = async (req, res, next) => {
  try {
    const result = await overheadService.getOverhead(req.user.userId);
    return successResponse(res, 200, 'Overhead data retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { saveOverhead, getOverhead };
