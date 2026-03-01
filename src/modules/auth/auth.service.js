const jwt = require('jsonwebtoken');
const User = require('./user.model');
const Company = require('../company/company.model');
const ApiError = require('../../utils/ApiError');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in ms
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const register = async (name, email, password, companyName) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Email already in use');
  }

  const company = await Company.create({ name: companyName });

  const user = await User.create({
    name,
    email,
    password,
    role: 'owner',
    companyId: company._id,
  });

  const token = generateToken({
    userId: user._id,
    companyId: company._id,
    role: user.role,
  });

  return { token, user, company };
};

const login = async (email, password) => {
  const user = await User.findOne({ email }).populate('companyId', 'name');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken({
    userId: user._id,
    companyId: user.companyId._id,
    role: user.role,
  });

  return { token, user };
};

const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password').populate('companyId', 'name');
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};

module.exports = { register, login, getMe, COOKIE_OPTIONS };
