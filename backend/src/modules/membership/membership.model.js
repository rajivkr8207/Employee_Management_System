import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },

    storeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
      },
    ],

    role: {
      type: String,
      enum: ['owner', 'store_admin', 'manager', 'employee'],
      required: true,
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true },
);

membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export const MembershipModel = mongoose.model('Membership', membershipSchema);
