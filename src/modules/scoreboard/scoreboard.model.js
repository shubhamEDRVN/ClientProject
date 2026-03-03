const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    description: { type: String, default: '', trim: true },
    resource_type: {
      type: String,
      enum: ['youtube', 'pdf', 'course', 'other'],
      default: 'other',
    },
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
      trim: true,
    },
    category: { type: String, default: '', trim: true },
    display_order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

resourceSchema.index({ companyId: 1, display_order: 1 });

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    completed: { type: Boolean, default: false },
    completed_at: { type: Date, default: null },
  },
  { timestamps: true }
);

// Each user can have only one progress record per resource
userProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });
userProgressSchema.index({ companyId: 1 });

const Resource = mongoose.model('Resource', resourceSchema);
const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = { Resource, UserProgress };
