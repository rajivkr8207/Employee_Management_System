import mongoose from 'mongoose';
const shiftSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String, // "09:00"
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    endTime: {
      type: String, // "18:00"
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true },
);

export const ShiftModel = mongoose.model('Shift', shiftSchema);
