import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getAdminDashboardStats,
  listAdminEmployees,
  listAdminStores,
  listAdminUsers,
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