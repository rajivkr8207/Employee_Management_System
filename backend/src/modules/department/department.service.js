import { ApiError } from '../../utils/ApiError.js';
import { DepartmentModel, DesignationModel } from './department.model.js';
import { authorizeOrganizationAccess } from '../membership/membership.service.js';

export const createDepartment = async (data, userId) => {
  const { name, code, organizationId, description } = data;
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    allowedRoles: ['owner', 'store_admin'],
  });

  const existing = await DepartmentModel.findOne({ organizationId, code: code.toUpperCase() });
  if (existing) {
    throw new ApiError(409, 'A department with this code already exists in your organization');
  }

  return DepartmentModel.create({
    name,
    code: code.toUpperCase(),
    organizationId,
    description,
  });
};

export const listDepartments = async ({ organizationId, userId }) => {
  await authorizeOrganizationAccess({
    userId,
    organizationId,
  });
  return DepartmentModel.find({ organizationId }).sort({ createdAt: -1 });
};

export const getDepartment = async (departmentId, userId) => {
  const dept = await DepartmentModel.findById(departmentId);
  if (!dept) throw new ApiError(404, 'Department not found');
  await authorizeOrganizationAccess({
    userId,
    organizationId: dept.organizationId,
  });
  return dept;
};

export const updateDepartment = async (departmentId, updates, userId) => {
  const dept = await DepartmentModel.findById(departmentId);
  if (!dept) throw new ApiError(404, 'Department not found');

  await authorizeOrganizationAccess({
    userId,
    organizationId: dept.organizationId,
    allowedRoles: ['owner', 'store_admin'],
  });

  const allowed = ['name', 'description', 'status'];
  const updateData = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k)),
  );

  return DepartmentModel.findByIdAndUpdate(departmentId, { $set: updateData }, { new: true });
};

export const deleteDepartment = async (departmentId, userId) => {
  const dept = await DepartmentModel.findById(departmentId);
  if (!dept) throw new ApiError(404, 'Department not found');

  await authorizeOrganizationAccess({
    userId,
    organizationId: dept.organizationId,
    allowedRoles: ['owner', 'store_admin'],
  });

  await DesignationModel.deleteMany({ departmentId });
  await DepartmentModel.findByIdAndDelete(departmentId);
  return { message: 'Department and associated designations removed' };
};

export const createDesignation = async (data, userId) => {
  const { title, departmentId, level, baseSalary } = data;
  const dept = await DepartmentModel.findById(departmentId);
  if (!dept) throw new ApiError(404, 'Department not found');

  await authorizeOrganizationAccess({
    userId,
    organizationId: dept.organizationId,
    allowedRoles: ['owner', 'store_admin'],
  });

  const existing = await DesignationModel.findOne({
    organizationId: dept.organizationId,
    departmentId,
    title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
  });
  if (existing) {
    throw new ApiError(409, 'A designation with this title already exists in this department');
  }

  return DesignationModel.create({
    title,
    departmentId,
    organizationId: dept.organizationId,
    level,
    baseSalary: baseSalary || 0,
  });
};

export const listDesignations = async ({ organizationId, departmentId, userId }) => {
  await authorizeOrganizationAccess({
    userId,
    organizationId,
  });
  const filter = { organizationId };
  if (departmentId) filter.departmentId = departmentId;
  return DesignationModel.find(filter).populate('departmentId', 'name code').sort({ title: 1 });
};

export const updateDesignation = async (designationId, updates, userId) => {
  const designation = await DesignationModel.findById(designationId);
  if (!designation) throw new ApiError(404, 'Designation not found');

  await authorizeOrganizationAccess({
    userId,
    organizationId: designation.organizationId,
    allowedRoles: ['owner', 'store_admin'],
  });

  const allowed = ['title', 'level', 'baseSalary', 'status'];
  const updateData = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k)),
  );

  return DesignationModel.findByIdAndUpdate(designationId, { $set: updateData }, { new: true });
};

export const deleteDesignation = async (designationId, userId) => {
  const designation = await DesignationModel.findById(designationId);
  if (!designation) throw new ApiError(404, 'Designation not found');

  await authorizeOrganizationAccess({
    userId,
    organizationId: designation.organizationId,
    allowedRoles: ['owner', 'store_admin'],
  });

  await DesignationModel.findByIdAndDelete(designationId);
  return { message: 'Designation removed' };
};
