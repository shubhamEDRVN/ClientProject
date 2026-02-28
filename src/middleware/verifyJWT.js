const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return 'dev-secret-change-in-production';
};

const verifyJWT = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return next(ApiError.unauthorized('No token provided'));
    }

    const decoded = jwt.verify(token, getJwtSecret());
    req.user = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role,
    };
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

module.exports = verifyJWT;
