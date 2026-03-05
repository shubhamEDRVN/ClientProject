const learnService = require('./learn.service');
const {
  createSystemSchema,
  updateSystemSchema,
  createResourceSchema,
  updateResourceSchema,
} = require('./learn.validation');
const { successResponse } = require('../../utils/apiResponse');
const ApiError = require('../../utils/ApiError');

// ─── Owner: Learn Routes ────────────────────────────────────────────

const getSystems = async (req, res, next) => {
  try {
    const data = await learnService.getSystemsForUser(req.user.userId);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

const getScore = async (req, res, next) => {
  try {
    const data = await learnService.getScoreSummary(req.user.userId);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

const markComplete = async (req, res, next) => {
  try {
    const data = await learnService.markResourceComplete(
      req.user.userId,
      req.params.resourceId
    );
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

const unmarkComplete = async (req, res, next) => {
  try {
    const data = await learnService.unmarkResourceComplete(
      req.user.userId,
      req.params.resourceId
    );
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const data = await learnService.getScoreHistory(req.user.userId);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// ─── Admin: System Management ───────────────────────────────────────

const adminGetSystems = async (req, res, next) => {
  try {
    const systems = await learnService.getAllSystemsAdmin();
    return successResponse(res, 200, 'Systems retrieved', { systems });
  } catch (err) {
    next(err);
  }
};

const adminCreateSystem = async (req, res, next) => {
  try {
    const { error, value } = createSystemSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return next(
        ApiError.badRequest(error.details.map((d) => d.message).join(', '))
      );
    }
    const system = await learnService.createSystem(value);
    return successResponse(res, 201, 'System created', { system });
  } catch (err) {
    next(err);
  }
};

const adminUpdateSystem = async (req, res, next) => {
  try {
    const { error, value } = updateSystemSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return next(
        ApiError.badRequest(error.details.map((d) => d.message).join(', '))
      );
    }
    const system = await learnService.updateSystem(req.params.id, value);
    return successResponse(res, 200, 'System updated', { system });
  } catch (err) {
    next(err);
  }
};

const adminDeleteSystem = async (req, res, next) => {
  try {
    await learnService.deleteSystem(req.params.id);
    return successResponse(res, 200, 'System deactivated');
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Resource Management ─────────────────────────────────────

const adminGetResources = async (req, res, next) => {
  try {
    const resources = await learnService.getResourcesForSystemAdmin(
      req.params.systemId
    );
    return successResponse(res, 200, 'Resources retrieved', { resources });
  } catch (err) {
    next(err);
  }
};

const adminCreateResource = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.params.systemId) body.systemId = req.params.systemId;
    const { error, value } = createResourceSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return next(
        ApiError.badRequest(error.details.map((d) => d.message).join(', '))
      );
    }
    const resource = await learnService.createResource(value);
    return successResponse(res, 201, 'Resource created', { resource });
  } catch (err) {
    next(err);
  }
};

const adminUpdateResource = async (req, res, next) => {
  try {
    const { error, value } = updateResourceSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return next(
        ApiError.badRequest(error.details.map((d) => d.message).join(', '))
      );
    }
    const resource = await learnService.updateResource(
      req.params.resourceId,
      value
    );
    return successResponse(res, 200, 'Resource updated', { resource });
  } catch (err) {
    next(err);
  }
};

const adminDeleteResource = async (req, res, next) => {
  try {
    const { resource, completionCount } = await learnService.deleteResource(
      req.params.resourceId
    );
    const message =
      completionCount > 0
        ? `${completionCount} users have completed this resource. It will be hidden but not deleted.`
        : 'Resource deactivated';
    return successResponse(res, 200, message, { resource });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Moderation ──────────────────────────────────────────────

const getPendingResources = async (req, res, next) => {
  try {
    const resources = await learnService.getPendingResources();
    return successResponse(res, 200, 'Pending resources retrieved', { resources });
  } catch (err) {
    next(err);
  }
};

const getModerationQueue = async (req, res, next) => {
  try {
    const { status } = req.query;
    const resources = await learnService.getModerationQueue(status || null);
    return successResponse(res, 200, 'Moderation queue retrieved', { resources });
  } catch (err) {
    next(err);
  }
};

const approveResource = async (req, res, next) => {
  try {
    const { note } = req.body;
    const resource = await learnService.moderateResource(
      req.params.resourceId,
      'approved',
      req.user.userId,
      note || ''
    );
    return successResponse(res, 200, 'Resource approved', { resource });
  } catch (err) {
    next(err);
  }
};

const rejectResource = async (req, res, next) => {
  try {
    const { note } = req.body;
    const resource = await learnService.moderateResource(
      req.params.resourceId,
      'rejected',
      req.user.userId,
      note || ''
    );
    return successResponse(res, 200, 'Resource rejected', { resource });
  } catch (err) {
    next(err);
  }
};

// ─── Admin: Dashboard Stats ─────────────────────────────────────────

const getAdminStats = async (req, res, next) => {
  try {
    const stats = await learnService.getAdminStats();
    return successResponse(res, 200, 'Admin stats retrieved', { stats });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSystems,
  getScore,
  markComplete,
  unmarkComplete,
  getHistory,
  adminGetSystems,
  adminCreateSystem,
  adminUpdateSystem,
  adminDeleteSystem,
  adminGetResources,
  adminCreateResource,
  adminUpdateResource,
  adminDeleteResource,
  getPendingResources,
  getModerationQueue,
  approveResource,
  rejectResource,
  getAdminStats,
};
