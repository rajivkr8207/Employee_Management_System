import { ROLES } from '../../constants/roles.js';
import User from '../user/user.model.js';
import { StoreModel } from '../store/store.model.js';
import { EmployeeModel } from '../employee/employee.model.js';

const userFields =
  'fullName username email mobile avatar role isVerified isApproved isActive isBlocked createdAt';

const getUserStatus = (user) => {
  if (user.isBlocked) return 'blocked';
  if (!user.isActive) return 'inactive';
  if (!user.isVerified) return 'unverified';
  if (!user.isApproved) return 'pending';
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
    User.countDocuments({ isApproved: false }),
    User.countDocuments({ isBlocked: true }),
    User.countDocuments({ isActive: true, isBlocked: false }),
    StoreModel.countDocuments(),
    StoreModel.countDocuments({ status: 'active' }),
    StoreModel.countDocuments({ status: 'inactive' }),
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
      .select('fullName role isVerified isApproved isActive isBlocked createdAt')
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