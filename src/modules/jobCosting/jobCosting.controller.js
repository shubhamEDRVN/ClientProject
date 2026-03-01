const jobCostingService = require('./jobCosting.service');
const { createJobSchema, updateJobSchema } = require('./jobCosting.validation');
const { successResponse } = require('../../utils/apiResponse');
const ApiError = require('../../utils/ApiError');

const createJob = async (req, res, next) => {
  try {
    const { error, value } = createJobSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const result = await jobCostingService.createJob(req.user.userId, req.user.companyId, value);
    return successResponse(res, 201, 'Job created successfully', result);
  } catch (err) {
    next(err);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const jobs = await jobCostingService.getJobs(req.user.companyId);
    return successResponse(res, 200, 'Jobs retrieved successfully', { jobs });
  } catch (err) {
    next(err);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const result = await jobCostingService.getJobById(req.params.id, req.user.companyId, req.user.userId);
    return successResponse(res, 200, 'Job retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const { error, value } = updateJobSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(ApiError.badRequest(error.details.map((d) => d.message).join(', ')));
    }

    const result = await jobCostingService.updateJob(req.params.id, req.user.companyId, req.user.userId, value);
    return successResponse(res, 200, 'Job updated successfully', result);
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    await jobCostingService.deleteJob(req.params.id, req.user.companyId);
    return successResponse(res, 200, 'Job deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob };
