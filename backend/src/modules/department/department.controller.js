import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createDepartment,
  listDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  createDesignation,
  listDesignations,
  updateDesignation,
  deleteDesignation,
} from './department.service.js';

export const addDepartment = asyncHandler(async (req, res) => {
  const department = await createDepartment(req.body, req.user.id);
  return res
    .status(201)
    .json(new ApiResponse(201, { department }, 'Department created successfully'));
});

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await listDepartments({
    organizationId: req.query.organizationId,
    userId: req.user.id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { departments }, 'Departments fetched successfully'));
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await getDepartment(req.params.id, req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { department }, 'Department fetched successfully'));
});

export const modifyDepartment = asyncHandler(async (req, res) => {
  const department = await updateDepartment(req.params.id, req.body, req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { department }, 'Department updated successfully'));
});

export const removeDepartment = asyncHandler(async (req, res) => {
  const result = await deleteDepartment(req.params.id, req.user.id);
  return res.status(200).json(new ApiResponse(200, result, 'Department deleted successfully'));
});

export const addDesignation = asyncHandler(async (req, res) => {
  const designation = await createDesignation(req.body, req.user.id);
  return res
    .status(201)
    .json(new ApiResponse(201, { designation }, 'Designation created successfully'));
});

export const getDesignations = asyncHandler(async (req, res) => {
  const designations = await listDesignations({
    organizationId: req.query.organizationId,
    departmentId: req.query.departmentId,
    userId: req.user.id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { designations }, 'Designations fetched successfully'));
});

export const modifyDesignation = asyncHandler(async (req, res) => {
  const designation = await updateDesignation(req.params.id, req.body, req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { designation }, 'Designation updated successfully'));
});

export const removeDesignation = asyncHandler(async (req, res) => {
  const result = await deleteDesignation(req.params.id, req.user.id);
  return res.status(200).json(new ApiResponse(200, result, 'Designation deleted successfully'));
});
