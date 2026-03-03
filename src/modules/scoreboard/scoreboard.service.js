const mongoose = require('mongoose');
const { Resource, UserProgress } = require('./scoreboard.model');
const User = require('../auth/user.model');
const ApiError = require('../../utils/ApiError');

// ─── Admin: Resource CRUD ───────────────────────────────────────────

const createResource = async (userId, companyId, data) => {
  const resource = await Resource.create({ ...data, companyId, created_by: userId });
  return resource;
};

const getResources = async (companyId) => {
  return Resource.find({ companyId }).sort({ display_order: 1, createdAt: -1 }).lean();
};

const getResourceById = async (resourceId, companyId) => {
  const resource = await Resource.findOne({ _id: resourceId, companyId });
  if (!resource) {
    throw ApiError.notFound('Resource not found');
  }
  return resource;
};

const updateResource = async (resourceId, companyId, data) => {
  const resource = await Resource.findOneAndUpdate(
    { _id: resourceId, companyId },
    data,
    { new: true, runValidators: true }
  );
  if (!resource) {
    throw ApiError.notFound('Resource not found');
  }
  return resource;
};

const deleteResource = async (resourceId, companyId) => {
  const resource = await Resource.findOneAndDelete({ _id: resourceId, companyId });
  if (!resource) {
    throw ApiError.notFound('Resource not found');
  }
  // Clean up any progress records tied to this resource
  await UserProgress.deleteMany({ resourceId });
  return resource;
};

// ─── User: Progress Tracking ────────────────────────────────────────

const getMyProgress = async (userId, companyId) => {
  const resources = await Resource.find({ companyId })
    .sort({ display_order: 1, createdAt: -1 })
    .lean();

  const progressRecords = await UserProgress.find({ userId, companyId }).lean();
  const progressMap = {};
  for (const p of progressRecords) {
    progressMap[p.resourceId.toString()] = {
      completed: p.completed,
      completed_at: p.completed_at,
    };
  }

  const resourcesWithProgress = resources.map((r) => ({
    ...r,
    completed: progressMap[r._id.toString()]?.completed || false,
    completed_at: progressMap[r._id.toString()]?.completed_at || null,
  }));

  const totalResources = resources.length;
  const completedCount = resourcesWithProgress.filter((r) => r.completed).length;
  const progress_pct = totalResources === 0 ? 0 : Math.round((completedCount / totalResources) * 100);

  return {
    resources: resourcesWithProgress,
    summary: {
      total_resources: totalResources,
      completed: completedCount,
      remaining: totalResources - completedCount,
      progress_pct,
    },
  };
};

const updateProgress = async (userId, companyId, resourceId, completed) => {
  // Verify the resource exists and belongs to this company
  const resource = await Resource.findOne({ _id: resourceId, companyId });
  if (!resource) {
    throw ApiError.notFound('Resource not found');
  }

  const progress = await UserProgress.findOneAndUpdate(
    { userId, resourceId },
    {
      userId,
      companyId,
      resourceId,
      completed,
      completed_at: completed ? new Date() : null,
    },
    { new: true, upsert: true, runValidators: true }
  );

  return progress;
};

// ─── Scoreboard: Company-wide Leaderboard ───────────────────────────

const getScoreboard = async (companyId) => {
  const resources = await Resource.find({ companyId }).lean();
  const totalResources = resources.length;

  if (totalResources === 0) {
    return { scoreboard: [], total_resources: 0 };
  }

  // Aggregate completed counts per user
  const progressAgg = await UserProgress.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId), completed: true } },
    {
      $group: {
        _id: '$userId',
        completed_count: { $sum: 1 },
        last_completed_at: { $max: '$completed_at' },
      },
    },
    { $sort: { completed_count: -1, last_completed_at: 1 } },
  ]);

  // Look up user names
  const userIds = progressAgg.map((p) => p._id);
  const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
  const userMap = {};
  for (const u of users) {
    userMap[u._id.toString()] = { name: u.name, email: u.email };
  }

  const scoreboard = progressAgg.map((entry) => {
    const user = userMap[entry._id.toString()] || { name: 'Unknown', email: '' };
    const progress_pct = Math.round((entry.completed_count / totalResources) * 100);
    return {
      userId: entry._id,
      name: user.name,
      email: user.email,
      completed_count: entry.completed_count,
      total_resources: totalResources,
      progress_pct,
      last_completed_at: entry.last_completed_at,
    };
  });

  return { scoreboard, total_resources: totalResources };
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
