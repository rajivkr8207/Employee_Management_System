import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createEmployee, getEmployee, listEmployees } from './employee.service.js';

export const addEmployee = asyncHandler(async (req, res) => {
  const employee = await createEmployee(req.body, req.user.id);
  return res.status(201).json(new ApiResponse(201, { employee }, 'Employee added successfully'));
});

export const getEmployees = asyncHandler(async (req, res) => {
  const employees = await listEmployees({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    storeId: req.query.storeId,
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
