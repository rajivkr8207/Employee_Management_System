import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getAdminDashboardStats,
  listAdminEmployees,
  listAdminStores,
  listStoreVerifications,
  listAdminUsers,
  reviewStoreVerification,
  listAdminManagers,
  reviewManagerVerification,
} from './admin.service.js';

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const stats = await getAdminDashboardStats();
  return res.status(200).json(new ApiResponse(200, stats, 'Admin dashboard stats fetched'));
});

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await listAdminUsers();
  return res.status(200).json(new ApiResponse(200, { users }, 'Users fetched successfully'));
});

export const getStores = asyncHandler(async (_req, res) => {
  const stores = await listAdminStores();
  return res.status(200).json(new ApiResponse(200, { stores }, 'Stores fetched successfully'));
});

export const getEmployees = asyncHandler(async (_req, res) => {
  const employees = await listAdminEmployees();
  return res
    .status(200)
    .json(new ApiResponse(200, { employees }, 'Employees fetched successfully'));
});

export const getStoreVerifications = asyncHandler(async (_req, res) => {
  const stores = await listStoreVerifications();
  return res
    .status(200)
    .json(new ApiResponse(200, { stores }, 'Store verifications fetched successfully'));
});

export const approveStore = asyncHandler(async (req, res) => {
  const store = await reviewStoreVerification(req.params.storeId, 'approved', req.user.id);
  return res.status(200).json(new ApiResponse(200, { store }, 'Store approved and activated'));
});

export const rejectStore = asyncHandler(async (req, res) => {
  const store = await reviewStoreVerification(
    req.params.storeId,
    'rejected',
    req.user.id,
    req.body.reason,
  );
  return res.status(200).json(new ApiResponse(200, { store }, 'Store application rejected'));
});

export const getManagerVerifications = asyncHandler(async (req, res) => {
  const managers = await listAdminManagers(req.query.status);
  return res
    .status(200)
    .json(new ApiResponse(200, { managers }, 'Manager verifications fetched successfully'));
});

export const approveManager = asyncHandler(async (req, res) => {
  const manager = await reviewManagerVerification(req.params.managerId, 'approved');
  return res.status(200).json(new ApiResponse(200, { manager }, 'Manager approved successfully'));
});

export const rejectManager = asyncHandler(async (req, res) => {
  const manager = await reviewManagerVerification(
    req.params.managerId,
    'rejected',
    req.body.reason,
  );
  return res.status(200).json(new ApiResponse(200, { manager }, 'Manager rejected successfully'));
});