const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const verifyJWT = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return next(ApiError.unauthorized('Access token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role,
    };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = verifyJWT;
