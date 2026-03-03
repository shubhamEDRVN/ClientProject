const mongoose = require('mongoose');

const scorecardsystemSchema = new mongoose.Schema({
  category:    { type: String, required: true },
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
scorecardsystemSchema.index({ category: 1, sortOrder: 1 });

const learningresourceSchema = new mongoose.Schema({
  systemId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ScorecardSystem', required: true },
  type:        { type: String, enum: ['video', 'pdf'], required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  url:         { type: String, required: true },
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
learningresourceSchema.index({ systemId: 1, sortOrder: 1 });

const resourcecompletionSchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  completedIds:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningResource' }],
  lastUpdated:       { type: Date, default: Date.now },
});
resourcecompletionSchema.index({ userId: 1 }, { unique: true });

const scorecardhistorySchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalScore:    { type: Number, required: true },
  healthPercent: { type: Number, required: true },
  savedAt:       { type: Date, default: Date.now },
});
scorecardhistorySchema.index({ userId: 1, savedAt: -1 });

const ScorecardSystem      = mongoose.model('ScorecardSystem', scorecardsystemSchema);
const LearningResource     = mongoose.model('LearningResource', learningresourceSchema);
const ResourceCompletion   = mongoose.model('ResourceCompletion', resourcecompletionSchema);
const ScorecardHistory     = mongoose.model('ScorecardHistory', scorecardhistorySchema);

module.exports = { ScorecardSystem, LearningResource, ResourceCompletion, ScorecardHistory };
