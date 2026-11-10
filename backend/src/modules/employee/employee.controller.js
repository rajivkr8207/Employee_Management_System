import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createEmployee,
  getEmployee,
  getMyEmployee,
  listEmployees,
  updateEmployee,
  softDeleteEmployee,
} from './employee.service.js';

export const addEmployee = asyncHandler(async (req, res) => {
  const employee = await createEmployee(req.body, req.user.id);
  return res.status(201).json(new ApiResponse(201, { employee }, 'Employee added successfully'));
});

export const getEmployees = asyncHandler(async (req, res) => {
  const employees = await listEmployees({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    storeId: req.query.storeId,
    page: req.query.page,
    limit: req.query.limit,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { employees }, 'Employees fetched successfully'));
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await getEmployee({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    employeeId: req.params.employeeId,
  });
  return res.status(200).json(new ApiResponse(200, { employee }, 'Employee fetched successfully'));
});

export const getMyEmployeeProfile = asyncHandler(async (req, res) => {
  const employee = await getMyEmployee(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { employee }, 'Employee profile fetched successfully'));
});

export const modifyEmployee = asyncHandler(async (req, res) => {
  const employee = await updateEmployee(req.params.employeeId, req.body, req.user.id);
  return res.status(200).json(new ApiResponse(200, { employee }, 'Employee updated successfully'));
});

export const removeEmployee = asyncHandler(async (req, res) => {
  const employee = await softDeleteEmployee(req.params.employeeId, req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { employee }, 'Employee deactivated successfully'));
});
