const ApiError = require('../utils/ApiError');
const { errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log the error
  logger.error(err.message || 'Unknown error', err.stack || '');

  // Handle custom ApiError
  if (err instanceof ApiError) {
    return errorResponse(res, err.statusCode, err.message);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 400, messages.join(', '));
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return errorResponse(res, 409, `${field} already exists`);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token has expired');
  }

  // Default internal server error
  const message = isProduction ? 'Internal Server Error' : err.message || 'Internal Server Error';
  return errorResponse(res, 500, message);
};

module.exports = errorHandler;
