const scoreboardService = require('./scoreboard.service');
const { createResourceSchema, updateResourceSchema, updateProgressSchema } = require('./scoreboard.validation');
const { successResponse } = require('../../utils/apiResponse');
const ApiError = require('../../utils/ApiError');

// ─── Admin: Resource CRUD ───────────────────────────────────────────

const createResource = async (req, res, next) => {
  try {
    const { error, value } = createResourceSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const resource = await scoreboardService.createResource(req.user.userId, req.user.companyId, value);
    return successResponse(res, 201, 'Resource created successfully', { resource });
  } catch (err) {
    next(err);
  }
};

const getResources = async (req, res, next) => {
  try {
    const resources = await scoreboardService.getResources(req.user.companyId);
    return successResponse(res, 200, 'Resources retrieved successfully', { resources });
  } catch (err) {
    next(err);
  }
};

const getResourceById = async (req, res, next) => {
  try {
    const resource = await scoreboardService.getResourceById(req.params.id, req.user.companyId);
    return successResponse(res, 200, 'Resource retrieved successfully', { resource });
  } catch (err) {
    next(err);
  }
};

const updateResource = async (req, res, next) => {
  try {
    const { error, value } = updateResourceSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const resource = await scoreboardService.updateResource(req.params.id, req.user.companyId, value);
    return successResponse(res, 200, 'Resource updated successfully', { resource });
  } catch (err) {
    next(err);
  }
};

const deleteResource = async (req, res, next) => {
  try {
    await scoreboardService.deleteResource(req.params.id, req.user.companyId);
    return successResponse(res, 200, 'Resource deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ─── User: Progress Tracking ────────────────────────────────────────

const getMyProgress = async (req, res, next) => {
  try {
    const result = await scoreboardService.getMyProgress(req.user.userId, req.user.companyId);
    return successResponse(res, 200, 'Progress retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const { error, value } = updateProgressSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const progress = await scoreboardService.updateProgress(
      req.user.userId,
      req.user.companyId,
      req.params.resourceId,
      value.completed
    );
    return successResponse(res, 200, 'Progress updated successfully', { progress });
  } catch (err) {
    next(err);
  }
};

// ─── Scoreboard: Company-wide Leaderboard ───────────────────────────

const getScoreboard = async (req, res, next) => {
  try {
    const result = await scoreboardService.getScoreboard(req.user.companyId);
    return successResponse(res, 200, 'Scoreboard retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  getMyProgress,
  updateProgress,
  getScoreboard,
};
