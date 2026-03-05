const mongoose = require('mongoose');
const { ScorecardSystem, LearningResource, ResourceCompletion, ScorecardHistory } = require('./learn.model');
const ApiError = require('../../utils/ApiError');

// ─── Score Calculation ──────────────────────────────────────────────

const calculateUserScore = async (userId) => {
  const systems = await ScorecardSystem.find({ isActive: true }).lean();
  const resources = await LearningResource.find({ isActive: true, moderationStatus: 'approved' }).lean();
  const completion = await ResourceCompletion.findOne({ userId }).lean();

  const completedSet = new Set(
    (completion?.completedIds || []).map((id) => id.toString())
  );

  // Group resources by systemId
  const resourcesBySystem = {};
  for (const r of resources) {
    const sysId = r.systemId.toString();
    if (!resourcesBySystem[sysId]) resourcesBySystem[sysId] = [];
    resourcesBySystem[sysId].push(r);
  }

  // Category tracking
  const categoryMap = {};
  let totalScore = 0;
  let completedSystems = 0;

  for (const sys of systems) {
    const sysResources = resourcesBySystem[sys._id.toString()] || [];
    const totalCount = sysResources.length;
    const completedCount = sysResources.filter((r) =>
      completedSet.has(r._id.toString())
    ).length;

    let systemScore = 0;
    if (totalCount > 0 && completedCount === totalCount) {
      systemScore = 10;
    } else if (completedCount > 0) {
      systemScore = Math.floor((completedCount / totalCount) * 10);
    }

    if (systemScore === 10) completedSystems++;
    totalScore += systemScore;

    if (!categoryMap[sys.category]) {
      categoryMap[sys.category] = { score: 0, max: 0, completed: 0, total: 0 };
    }
    categoryMap[sys.category].score += systemScore;
    categoryMap[sys.category].max += 10;
    categoryMap[sys.category].total += 1;
    if (systemScore === 10) categoryMap[sys.category].completed += 1;
  }

  const healthPercent = systems.length > 0
    ? parseFloat(((totalScore / (systems.length * 10)) * 100).toFixed(1))
    : 0;

  return {
    totalScore,
    healthPercent,
    completedSystems,
    totalSystems: systems.length,
    categoryMap,
  };
};

// ─── Snapshot Logic ─────────────────────────────────────────────────

const maybeCreateSnapshot = async (userId, totalScore, healthPercent) => {
  const lastSnapshot = await ScorecardHistory.findOne({ userId })
    .sort({ savedAt: -1 })
    .lean();

  if (!lastSnapshot) {
    // First snapshot — always save if score > 0
    if (totalScore > 0) {
      await ScorecardHistory.create({ userId, totalScore, healthPercent });
    }
    return;
  }

  const scoreDiff = Math.abs(totalScore - lastSnapshot.totalScore);
  const hoursSince = (Date.now() - new Date(lastSnapshot.savedAt).getTime()) / (1000 * 60 * 60);

  if (scoreDiff >= 10 || (hoursSince >= 24 && scoreDiff > 0)) {
    await ScorecardHistory.create({ userId, totalScore, healthPercent });
  }
};

// ─── Owner: Get Systems with Resources & Completion ─────────────────

const getSystemsForUser = async (userId) => {
  const systems = await ScorecardSystem.find({ isActive: true })
    .sort({ category: 1, sortOrder: 1 })
    .lean();
  const resources = await LearningResource.find({ isActive: true, moderationStatus: 'approved' })
    .sort({ sortOrder: 1 })
    .lean();
  const completion = await ResourceCompletion.findOne({ userId }).lean();

  const completedSet = new Set(
    (completion?.completedIds || []).map((id) => id.toString())
  );

  // Group resources by systemId
  const resourcesBySystem = {};
  for (const r of resources) {
    const sysId = r.systemId.toString();
    if (!resourcesBySystem[sysId]) resourcesBySystem[sysId] = [];
    resourcesBySystem[sysId].push(r);
  }

  // Build category groups
  const categoryOrder = [
    'Marketing & Lead Generation',
    'Sales & Conversion',
    'Operations & Dispatch',
    'Financial Systems',
    'Human Resources',
    'Customer Experience',
    'Leadership & Growth',
  ];

  const categoryGroupMap = {};
  let totalScore = 0;
  let completedSystems = 0;

  for (const sys of systems) {
    const sysResources = resourcesBySystem[sys._id.toString()] || [];
    const totalCount = sysResources.length;
    const completedCount = sysResources.filter((r) =>
      completedSet.has(r._id.toString())
    ).length;

    let systemScore = 0;
    if (totalCount > 0 && completedCount === totalCount) {
      systemScore = 10;
    } else if (completedCount > 0) {
      systemScore = Math.floor((completedCount / totalCount) * 10);
    }

    if (systemScore === 10) completedSystems++;
    totalScore += systemScore;

    if (!categoryGroupMap[sys.category]) {
      categoryGroupMap[sys.category] = {
        name: sys.category,
        categoryScore: 0,
        categoryMax: 0,
        categoryPercent: 0,
        systems: [],
      };
    }

    const cat = categoryGroupMap[sys.category];
    cat.categoryScore += systemScore;
    cat.categoryMax += 10;

    cat.systems.push({
      _id: sys._id,
      name: sys.name,
      description: sys.description,
      systemScore,
      totalResources: totalCount,
      completedResources: completedCount,
      isComplete: totalCount > 0 && completedCount === totalCount,
      resources: sysResources.map((r) => ({
        _id: r._id,
        type: r.type,
        title: r.title,
        description: r.description,
        url: r.url,
        isCompleted: completedSet.has(r._id.toString()),
      })),
    });
  }

  // Calculate category percentages
  for (const key of Object.keys(categoryGroupMap)) {
    const cat = categoryGroupMap[key];
    cat.categoryPercent = cat.categoryMax > 0
      ? parseFloat(((cat.categoryScore / cat.categoryMax) * 100).toFixed(1))
      : 0;
  }

  // Order categories
  const categories = categoryOrder
    .filter((c) => categoryGroupMap[c])
    .map((c) => categoryGroupMap[c]);

  const totalSystems = systems.length;
  const healthPercent = totalSystems > 0
    ? parseFloat(((totalScore / (totalSystems * 10)) * 100).toFixed(1))
    : 0;

  return {
    categories,
    totalScore,
    healthPercent,
    completedSystems,
    totalSystems,
  };
};

// ─── Owner: Get Score Summary ───────────────────────────────────────

const getScoreSummary = async (userId) => {
  const result = await calculateUserScore(userId);
  return {
    totalScore: result.totalScore,
    healthPercent: result.healthPercent,
    completedSystems: result.completedSystems,
    totalSystems: result.totalSystems,
  };
};

// ─── Owner: Mark Resource Complete ──────────────────────────────────

const markResourceComplete = async (userId, resourceId) => {
  const resource = await LearningResource.findOne({
    _id: resourceId,
    isActive: true,
  });
  if (!resource) throw ApiError.notFound('Resource not found');

  await ResourceCompletion.findOneAndUpdate(
    { userId },
    {
      $addToSet: { completedIds: resourceId },
      $set: { lastUpdated: new Date() },
    },
    { upsert: true }
  );

  // Recalculate scores
  const score = await calculateUserScore(userId);

  // System-level score for the resource's system
  const systemResources = await LearningResource.find({
    systemId: resource.systemId,
    isActive: true,
  }).lean();
  const completion = await ResourceCompletion.findOne({ userId }).lean();
  const completedSet = new Set(
    (completion?.completedIds || []).map((id) => id.toString())
  );
  const completedCount = systemResources.filter((r) =>
    completedSet.has(r._id.toString())
  ).length;
  const totalCount = systemResources.length;
  let systemScore = 0;
  if (totalCount > 0 && completedCount === totalCount) {
    systemScore = 10;
  } else if (completedCount > 0) {
    systemScore = Math.floor((completedCount / totalCount) * 10);
  }

  await maybeCreateSnapshot(userId, score.totalScore, score.healthPercent);

  return {
    resourceId,
    isCompleted: true,
    systemScore,
    totalScore: score.totalScore,
    healthPercent: score.healthPercent,
  };
};

// ─── Owner: Unmark Resource ─────────────────────────────────────────

const unmarkResourceComplete = async (userId, resourceId) => {
  const resource = await LearningResource.findOne({
    _id: resourceId,
    isActive: true,
  });
  if (!resource) throw ApiError.notFound('Resource not found');

  await ResourceCompletion.findOneAndUpdate(
    { userId },
    {
      $pull: { completedIds: new mongoose.Types.ObjectId(resourceId) },
      $set: { lastUpdated: new Date() },
    }
  );

  const score = await calculateUserScore(userId);

  // System-level score
  const systemResources = await LearningResource.find({
    systemId: resource.systemId,
    isActive: true,
  }).lean();
  const completion = await ResourceCompletion.findOne({ userId }).lean();
  const completedSet = new Set(
    (completion?.completedIds || []).map((id) => id.toString())
  );
  const completedCount = systemResources.filter((r) =>
    completedSet.has(r._id.toString())
  ).length;
  const totalCount = systemResources.length;
  let systemScore = 0;
  if (totalCount > 0 && completedCount === totalCount) {
    systemScore = 10;
  } else if (completedCount > 0) {
    systemScore = Math.floor((completedCount / totalCount) * 10);
  }

  await maybeCreateSnapshot(userId, score.totalScore, score.healthPercent);

  return {
    resourceId,
    isCompleted: false,
    systemScore,
    totalScore: score.totalScore,
    healthPercent: score.healthPercent,
  };
};

// ─── Owner: Score History ───────────────────────────────────────────

const getScoreHistory = async (userId) => {
  const history = await ScorecardHistory.find({ userId })
    .sort({ savedAt: -1 })
    .limit(100)
    .lean();
  return { history };
};

// ─── Admin: System CRUD ─────────────────────────────────────────────

const createSystem = async (data) => {
  return ScorecardSystem.create(data);
};

const updateSystem = async (systemId, data) => {
  const system = await ScorecardSystem.findByIdAndUpdate(systemId, data, {
    new: true,
    runValidators: true,
  });
  if (!system) throw ApiError.notFound('System not found');
  return system;
};

const deleteSystem = async (systemId) => {
  const system = await ScorecardSystem.findByIdAndUpdate(
    systemId,
    { isActive: false },
    { new: true }
  );
  if (!system) throw ApiError.notFound('System not found');
  return system;
};

const getAllSystemsAdmin = async () => {
  return ScorecardSystem.find().sort({ category: 1, sortOrder: 1 }).lean();
};

// ─── Admin: Resource CRUD ───────────────────────────────────────────

const createResource = async (data) => {
  const system = await ScorecardSystem.findById(data.systemId);
  if (!system) throw ApiError.notFound('System not found');
  return LearningResource.create(data);
};

const updateResource = async (resourceId, data) => {
  const resource = await LearningResource.findByIdAndUpdate(resourceId, data, {
    new: true,
    runValidators: true,
  });
  if (!resource) throw ApiError.notFound('Resource not found');
  return resource;
};

const deleteResource = async (resourceId) => {
  const resource = await LearningResource.findById(resourceId);
  if (!resource) throw ApiError.notFound('Resource not found');

  // Check if any users have completed this resource
  const completionCount = await ResourceCompletion.countDocuments({
    completedIds: resourceId,
  });

  // Soft-delete only
  resource.isActive = false;
  await resource.save();

  return { resource, completionCount };
};

const getResourcesForSystemAdmin = async (systemId) => {
  return LearningResource.find({ systemId }).sort({ sortOrder: 1 }).lean();
};

// ─── Admin: Moderation ──────────────────────────────────────────────

const getPendingResources = async () => {
  return LearningResource.find({ moderationStatus: 'pending' })
    .populate('systemId', 'name category')
    .sort({ createdAt: -1 })
    .lean();
};

const getModerationQueue = async (status) => {
  const filter = status ? { moderationStatus: status } : {};
  return LearningResource.find(filter)
    .populate('systemId', 'name category')
    .populate('moderatedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

const moderateResource = async (resourceId, status, adminUserId, note = '') => {
  const resource = await LearningResource.findById(resourceId);
  if (!resource) throw ApiError.notFound('Resource not found');

  resource.moderationStatus = status;
  resource.moderatedBy = adminUserId;
  resource.moderatedAt = new Date();
  resource.moderationNote = note;
  await resource.save();

  return resource;
};

// ─── Admin: Dashboard Stats ─────────────────────────────────────────

const getAdminStats = async () => {
  const User = require('../auth/user.model');
  const Company = require('../company/company.model');

  const [totalCompanies, totalUsers, totalResources, pendingModeration, totalSystems] = await Promise.all([
    Company.countDocuments(),
    User.countDocuments(),
    LearningResource.countDocuments(),
    LearningResource.countDocuments({ moderationStatus: 'pending' }),
    ScorecardSystem.countDocuments({ isActive: true }),
  ]);

  return { totalCompanies, totalUsers, totalResources, pendingModeration, totalSystems };
};

module.exports = {
  calculateUserScore,
  getSystemsForUser,
  getScoreSummary,
  markResourceComplete,
  unmarkResourceComplete,
  getScoreHistory,
  createSystem,
  updateSystem,
  deleteSystem,
  getAllSystemsAdmin,
  createResource,
  updateResource,
  deleteResource,
  getResourcesForSystemAdmin,
  getPendingResources,
  getModerationQueue,
  moderateResource,
  getAdminStats,
};
