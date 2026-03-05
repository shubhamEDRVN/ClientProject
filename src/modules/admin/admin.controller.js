const adminService = require('./admin.service');
const { successResponse } = require('../../utils/apiResponse');

// ─── Business Management ────────────────────────────────────────────

const listCompanies = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.query;
    const data = await adminService.listCompanies({
      search,
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });
    return successResponse(res, 200, 'Companies retrieved', data);
  } catch (err) {
    next(err);
  }
};

const getCompanyDetails = async (req, res, next) => {
  try {
    const data = await adminService.getCompanyDetails(req.params.companyId);
    return successResponse(res, 200, 'Company details retrieved', data);
  } catch (err) {
    next(err);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await adminService.updateCompany(req.params.companyId, req.body);
    return successResponse(res, 200, 'Company updated', { company });
  } catch (err) {
    next(err);
  }
};

const toggleCompanyActive = async (req, res, next) => {
  try {
    const company = await adminService.toggleCompanyActive(req.params.companyId);
    return successResponse(res, 200, `Company ${company.isActive ? 'activated' : 'deactivated'}`, { company });
  } catch (err) {
    next(err);
  }
};

// ─── User Management ────────────────────────────────────────────────

const listUsers = async (req, res, next) => {
  try {
    const { search, role, page, limit } = req.query;
    const data = await adminService.listUsers({
      search,
      role,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });
    return successResponse(res, 200, 'Users retrieved', data);
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const user = await adminService.updateUserRole(req.params.userId, req.body.role);
    return successResponse(res, 200, 'User role updated', { user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCompanies,
  getCompanyDetails,
  updateCompany,
  toggleCompanyActive,
  listUsers,
  updateUserRole,
};
