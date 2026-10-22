import mongoose from 'mongoose';
import { ROLES } from '../../constants/roles.js';
import { ApiError } from '../../utils/ApiError.js';
import User from '../user/user.model.js';
import { organizationModel } from './organization.model.js';

const organizationFields = ['name', 'email', 'phone', 'businessType'];
const addressFields = ['street', 'city', 'state', 'pincode', 'country'];

const pickOrganizationFields = (organizationData) =>
  Object.fromEntries(
    organizationFields
      .filter((field) => Object.hasOwn(organizationData, field))
      .map((field) => [field, organizationData[field]]),
  );

const ensureOrganizationOwner = async (ownerId) => {
  const user = await User.findById(ownerId).select('_id role');
  if (!user) throw new ApiError(404, 'User account was not found');
  if (![ROLES.EMPLOYEE, ROLES.STORE_ADMIN].includes(user.role)) {
    throw new ApiError(403, 'Only registered organization owners can create an organization');
  }
  return user;
};

export const createOrganization = async (organizationData, ownerId) => {
  const owner = await ensureOrganizationOwner(ownerId);
  if (await organizationModel.exists({ ownerId })) {
    throw new ApiError(409, 'This user already has an organization');
  }
  const email = organizationData.email.trim().toLowerCase();
  if (await organizationModel.exists({ email })) {
    throw new ApiError(409, 'An organization with this email already exists');
  }

  let organization;
  try {
    organization = await organizationModel.create({
      ...pickOrganizationFields(organizationData),
      email,
      ownerId,
      ...(organizationData.address
        ? {
            address: Object.fromEntries(
              addressFields
                .filter((field) => Object.hasOwn(organizationData.address, field))
                .map((field) => [field, organizationData.address[field]]),
            ),
          }
        : {}),
    });
  } catch (error) {
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      if (error.keyPattern?.ownerId) {
        throw new ApiError(409, 'This user already has an organization');
      }
      throw new ApiError(409, 'An organization with this email already exists');
    }
    throw error;
  }

  if (owner.role !== ROLES.STORE_ADMIN) {
    owner.role = ROLES.STORE_ADMIN;
    await owner.save();
  }
  return organization;
};

export const getOwnerOrganization = async (ownerId) => {
  const organization = await organizationModel.findOne({ ownerId }).sort({ createdAt: -1 });
  if (!organization) throw new ApiError(404, 'Organization was not found');
  return organization;
};

export const listPendingOrganizations = () =>
  organizationModel
    .find({ verificationStatus: 'pending' })
    .populate('ownerId', 'fullName username email')
    .sort({ createdAt: 1 });

export const updateOrganizationApproval = async (organizationId, status, adminId) => {
  const organization = await organizationModel.findOneAndUpdate(
    { _id: organizationId, verificationStatus: 'pending' },
    {
      $set: {
        verificationStatus: status,
        verifiedBy: adminId,
        ...(status === 'rejected' ? { status: 'inactive' } : {}),
      },
    },
    { new: true, runValidators: true },
  );
  if (!organization) {
    throw new ApiError(404, 'Pending organization was not found');
  }
  return organization;
};

export const getApprovedOrganizationForOwner = async (ownerId) => {
  const organization = await organizationModel.findOne({ ownerId }).sort({ createdAt: -1 });
  if (!organization) throw new ApiError(403, 'Create an organization before creating a store');
  if (organization.verificationStatus !== 'approved' || organization.status !== 'active') {
    throw new ApiError(403, 'Organization must be approved before creating a store');
  }
  return organization;
};
