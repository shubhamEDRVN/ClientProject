const pricingService = require('./pricing.service');
const { pricingMatrixSchema } = require('./pricing.validation');
const { successResponse } = require('../../utils/apiResponse');
const ApiError = require('../../utils/ApiError');

const savePricingMatrix = async (req, res, next) => {
  try {
    const { error, value } = pricingMatrixSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const result = await pricingService.savePricingMatrix(req.user.userId, value);
    return successResponse(res, 200, 'Pricing matrix saved successfully', result);
  } catch (err) {
    next(err);
  }
};

const getPricingMatrix = async (req, res, next) => {
  try {
    const result = await pricingService.getPricingMatrix(req.user.userId);
    return successResponse(res, 200, 'Pricing matrix retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { savePricingMatrix, getPricingMatrix };
