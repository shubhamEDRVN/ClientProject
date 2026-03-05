const mongoose = require('mongoose');

const scorecardSystemSchema = new mongoose.Schema({
  category:    { type: String, required: true },
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
scorecardSystemSchema.index({ category: 1, sortOrder: 1 });

const learningResourceSchema = new mongoose.Schema({
  systemId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ScorecardSystem', required: true },
  type:        { type: String, enum: ['video', 'pdf'], required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  url:         { type: String, required: true },
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  moderatedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  moderatedAt:      { type: Date, default: null },
  moderationNote:   { type: String, default: '' },
}, { timestamps: true });
learningResourceSchema.index({ systemId: 1, sortOrder: 1 });
learningResourceSchema.index({ moderationStatus: 1 });

const resourceCompletionSchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  completedIds:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningResource' }],
  lastUpdated:       { type: Date, default: Date.now },
});

const scorecardHistorySchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalScore:    { type: Number, required: true },
  healthPercent: { type: Number, required: true },
  savedAt:       { type: Date, default: Date.now },
});
scorecardHistorySchema.index({ userId: 1, savedAt: -1 });

const ScorecardSystem      = mongoose.model('ScorecardSystem', scorecardSystemSchema);
const LearningResource     = mongoose.model('LearningResource', learningResourceSchema);
const ResourceCompletion   = mongoose.model('ResourceCompletion', resourceCompletionSchema);
const ScorecardHistory     = mongoose.model('ScorecardHistory', scorecardHistorySchema);

module.exports = { ScorecardSystem, LearningResource, ResourceCompletion, ScorecardHistory };
