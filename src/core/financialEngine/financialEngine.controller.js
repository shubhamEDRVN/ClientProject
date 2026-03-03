const financialEngineService = require('./financialEngine.service');
const { createSnapshotSchema, reportQuerySchema } = require('./financialEngine.validation');
const { successResponse } = require('../../utils/apiResponse');
const ApiError = require('../../utils/ApiError');

const getReport = async (req, res, next) => {
  try {
    const { error, value } = reportQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const report = await financialEngineService.generateReport(
      req.user.userId,
      req.user.companyId,
      value.period_start,
      value.period_end
    );
    return successResponse(res, 200, 'Financial report generated successfully', report);
  } catch (err) {
    next(err);
  }
};

const createSnapshot = async (req, res, next) => {
  try {
    const { error, value } = createSnapshotSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const snapshot = await financialEngineService.createSnapshot(req.user.userId, req.user.companyId, value);
    return successResponse(res, 201, 'Financial snapshot created successfully', { snapshot });
  } catch (err) {
    next(err);
  }
};

const getSnapshots = async (req, res, next) => {
  try {
    const snapshots = await financialEngineService.getSnapshots(req.user.companyId);
    return successResponse(res, 200, 'Snapshots retrieved successfully', { snapshots });
  } catch (err) {
    next(err);
  }
};

const getSnapshotById = async (req, res, next) => {
  try {
    const snapshot = await financialEngineService.getSnapshotById(req.params.id, req.user.companyId);
    return successResponse(res, 200, 'Snapshot retrieved successfully', { snapshot });
  } catch (err) {
    next(err);
  }
};

const deleteSnapshot = async (req, res, next) => {
  try {
    await financialEngineService.deleteSnapshot(req.params.id, req.user.companyId);
    return successResponse(res, 200, 'Snapshot deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getReport, createSnapshot, getSnapshots, getSnapshotById, deleteSnapshot };
