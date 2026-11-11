import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorName: { type: String, required: true, trim: true, maxlength: 120 },
    actorEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    actorRole: { type: String, required: true, trim: true, maxlength: 40 },
    action: { type: String, required: true, trim: true, maxlength: 160 },
    method: { type: String, required: true, enum: ['POST', 'PUT', 'PATCH', 'DELETE'] },
    route: { type: String, required: true, trim: true, maxlength: 240 },
    outcome: { type: String, required: true, enum: ['success', 'failure'], index: true },
    statusCode: { type: Number, required: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ actorEmail: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
