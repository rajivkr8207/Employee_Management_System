import { ApiError } from '../../utils/ApiError.js';
import { organizationModel } from '../organization/organization.model.js';
import { StoreModel } from '../store/store.model.js';
import { MembershipModel } from './membership.model.js';

export const authorizeOrganizationAccess = async ({
  userId,
  organizationId,
  storeId,
  allowedRoles = ['owner', 'store_admin', 'manager'],
}) => {
  const organization = await organizationModel
    .findById(organizationId)
    .select('_id ownerId status verificationStatus');
  if (!organization || organization.status !== 'active') {
    throw new ApiError(404, 'Organization was not found');
  }
  if (organization.verificationStatus !== 'approved') {
    throw new ApiError(403, 'Organization must be approved before it can be managed');
  }

  const isOwner = organization.ownerId.toString() === userId.toString();
  let membership = null;
  if (!isOwner) {
    membership = await MembershipModel.findOne({
      userId,
      organizationId,
      status: 'active',
    }).select('role storeIds');
    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ApiError(403, 'You do not have permission to access this organization');
    }
  }

  const allowedStoreIds = isOwner ? null : membership.storeIds.map((id) => id.toString());
  if (storeId) {
    const store = await StoreModel.findOne({ _id: storeId, organizationId }).select('_id');
    if (!store) throw new ApiError(404, 'Store was not found in this organization');
    if (allowedStoreIds && !allowedStoreIds.includes(store._id.toString())) {
      throw new ApiError(403, 'You do not have permission to access this store');
    }
  }

  return { organization, membership, isOwner, allowedStoreIds };
};

export const listMemberships = async ({ userId, organizationId, storeId }) => {
  const { isOwner, allowedStoreIds } = await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
  });
  const visibleStoreIds = storeId ? [storeId] : allowedStoreIds;
  const query = { organizationId, status: 'active' };
  if (visibleStoreIds) query.storeIds = { $in: visibleStoreIds };

  const memberships = await MembershipModel.find(query)
    .populate('userId', 'fullName username email mobile avatar')
    .populate('organizationId', 'name')
    .sort({ createdAt: -1 });

  if (isOwner) return memberships;
  return memberships.map((item) => {
    const result = item.toObject();
    result.storeIds = result.storeIds.filter((id) => visibleStoreIds.includes(id.toString()));
    return result;
  });
};
