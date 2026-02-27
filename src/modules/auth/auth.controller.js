const authService = require('./auth.service');
const { registerSchema, loginSchema } = require('./auth.validation');
const { successResponse } = require('../../utils/apiResponse');
const ApiError = require('../../utils/ApiError');

const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const { name, email, password, companyName } = value;
    const { token, user, company } = await authService.register(name, email, password, companyName);

    res.cookie('token', token, authService.COOKIE_OPTIONS);

    return successResponse(res, 201, 'Registration successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company._id,
        companyName: company.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const { email, password } = value;
    const { token, user } = await authService.login(email, password);

    res.cookie('token', token, authService.COOKIE_OPTIONS);

    return successResponse(res, 200, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId._id,
        companyName: user.companyId.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return successResponse(res, 200, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    return successResponse(res, 200, 'User retrieved successfully', { user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe };
