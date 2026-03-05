const Company = require('../company/company.model');
const User = require('../auth/user.model');
const ApiError = require('../../utils/ApiError');
const { VALID_ROLES } = require('../../utils/constants');

// ─── Business Management ────────────────────────────────────────────

const listCompanies = async ({ search, status, page = 1, limit = 20 }) => {
  const filter = {};

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  const skip = (page - 1) * limit;

  const [companies, total] = await Promise.all([
    Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Company.countDocuments(filter),
  ]);

  // Attach user counts
  const companyIds = companies.map((c) => c._id);
  const userCounts = await User.aggregate([
    { $match: { companyId: { $in: companyIds } } },
    { $group: { _id: '$companyId', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  for (const uc of userCounts) {
    countMap[uc._id.toString()] = uc.count;
  }

  const companiesWithCounts = companies.map((c) => ({
    ...c,
    userCount: countMap[c._id.toString()] || 0,
  }));

  return {
    companies: companiesWithCounts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

const getCompanyDetails = async (companyId) => {
  const company = await Company.findById(companyId).lean();
  if (!company) throw ApiError.notFound('Company not found');

  const users = await User.find({ companyId })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

  return { company, users };
};

const updateCompany = async (companyId, data) => {
  const company = await Company.findByIdAndUpdate(companyId, data, {
    new: true,
    runValidators: true,
  });
  if (!company) throw ApiError.notFound('Company not found');
  return company;
};

const toggleCompanyActive = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company) throw ApiError.notFound('Company not found');

  company.isActive = !company.isActive;
  await company.save();
  return company;
};

// ─── User Management ────────────────────────────────────────────────

const listUsers = async ({ search, role, page = 1, limit = 20 }) => {
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

const updateUserRole = async (userId, newRole) => {
  if (!VALID_ROLES.includes(newRole)) {
    throw ApiError.badRequest(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role: newRole },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) throw ApiError.notFound('User not found');
  return user;
};

module.exports = {
  listCompanies,
  getCompanyDetails,
  updateCompany,
  toggleCompanyActive,
  listUsers,
  updateUserRole,
};
