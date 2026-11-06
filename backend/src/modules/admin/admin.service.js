import { ROLES } from '../../constants/roles.js';
import User from '../user/user.model.js';
import { StoreModel } from '../store/store.model.js';
import { EmployeeModel } from '../employee/employee.model.js';
import { ApiError } from '../../utils/ApiError.js';

const userFields =
  'fullName username email mobile avatar role isVerified isApproved approvalStatus rejectionReason isActive isBlocked createdAt';

const getUserStatus = (user) => {
  if (user.isBlocked) return 'blocked';
  if (user.approvalStatus === 'rejected') return 'rejected';
  if (!user.isApproved) return 'pending';
  if (!user.isActive) return 'inactive';
  if (!user.isVerified) return 'unverified';
  return 'active';
};

export const listAdminUsers = () =>
  User.find()
    .select(userFields)
    .sort({ createdAt: -1 })
    .lean();

export const listAdminStores = async () => {
  const [stores, employeeCounts] = await Promise.all([
    StoreModel.find()
      .populate('organizationId', 'name')
      .populate('managerId', 'fullName email')
      .sort({ createdAt: -1 })
      .lean(),
    EmployeeModel.aggregate([{ $group: { _id: '$storeId', count: { $sum: 1 } } }]),
  ]);
  const countsByStoreId = new Map(
    employeeCounts.map(({ _id, count }) => [_id.toString(), count]),
  );

  return stores.map((store) => ({
    ...store,
    employeeCount: countsByStoreId.get(store._id.toString()) || 0,
  }));
};

export const listStoreVerifications = async () =>
  StoreModel.find()
    .populate('organizationId', 'name')
    .populate('createdBy', 'fullName username email mobile')
    .sort({ createdAt: -1 })
    .lean()
    .then((stores) =>
      stores.map((store) => ({
        ...store,
        verificationStatus:
          store.verificationStatus || (store.status === 'active' ? 'approved' : 'pending'),
      })),
    );

export const reviewStoreVerification = async (storeId, status, adminId, reason = null) => {
  const store = await StoreModel.findOneAndUpdate(
    {
      _id: storeId,
      $or: [
        { verificationStatus: 'pending' },
        { verificationStatus: { $exists: false }, status: 'inactive' },
      ],
    },
    {
      $set: {
        verificationStatus: status,
        status: status === 'approved' ? 'active' : 'inactive',
        rejectionReason: reason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  )
    .populate('organizationId', 'name')
    .populate('createdBy', 'fullName username email mobile');
  if (!store) {
    throw new ApiError(404, 'Pending store was not found');
  }
  return store;
};

export const listAdminEmployees = () =>
  EmployeeModel.find()
    .select('organizationId storeId userId employeeCode designation status createdAt')
    .populate('userId', 'fullName username email mobile avatar role isActive isBlocked')
    .populate('storeId', 'name code address')
    .populate('organizationId', 'name')
    .sort({ createdAt: -1 })
    .lean();

export const getAdminDashboardStats = async () => {
  const [
    totalUsers,
    verifiedUsers,
    pendingUsers,
    blockedUsers,
    activeUsers,
    totalStores,
    activeStores,
    inactiveStores,
    pendingStores,
    rejectedStores,
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    totalManagers,
    approvedManagers,
    pendingManagers,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({
      $or: [
        { approvalStatus: 'pending' },
        { approvalStatus: null, isApproved: false },
      ],
    }),
    User.countDocuments({ isBlocked: true }),
    User.countDocuments({ isActive: true, isBlocked: false }),
    StoreModel.countDocuments(),
    StoreModel.countDocuments({ status: 'active' }),
    StoreModel.countDocuments({ status: 'inactive' }),
    StoreModel.countDocuments({
      $or: [
        { verificationStatus: 'pending' },
        { verificationStatus: { $exists: false }, status: 'inactive' },
      ],
    }),
    StoreModel.countDocuments({ verificationStatus: 'rejected' }),
    EmployeeModel.countDocuments(),
    EmployeeModel.countDocuments({ status: 'active' }),
    EmployeeModel.countDocuments({ status: { $ne: 'active' } }),
    User.countDocuments({ role: ROLES.MANAGER }),
    User.countDocuments({
      role: ROLES.MANAGER,
      isApproved: true,
      isActive: true,
      isBlocked: false,
    }),
    User.countDocuments({ role: ROLES.MANAGER, isApproved: false }),
    User.find()
      .select('fullName role isVerified isApproved approvalStatus isActive isBlocked createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    users: {
      total: totalUsers,
      verified: verifiedUsers,
      pending: pendingUsers,
      blocked: blockedUsers,
      active: activeUsers,
    },
    stores: {
      total: totalStores,
      active: activeStores,
      inactive: inactiveStores,
      pending: pendingStores,
      rejected: rejectedStores,
    },
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      inactive: inactiveEmployees,
    },
    managers: {
      total: totalManagers,
      approved: approvedManagers,
      pending: pendingManagers,
    },
    recentRegistrations: recentUsers.map((user) => ({
      id: user._id.toString(),
      name: user.fullName,
      role: user.role,
      time: user.createdAt,
      status: getUserStatus(user),
    })),
  };
};