import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    from: {
      type: Date,
      required: true,
    },

    to: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value >= this.from;
        },
        message: 'Leave end date must be on or after start date',
      },
    },

    reason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const LeaveModel = mongoose.model('Leave', leaveSchema);
