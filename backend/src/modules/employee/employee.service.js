import mongoose from 'mongoose';
import { ROLES } from '../../constants/roles.js';
import { ApiError } from '../../utils/ApiError.js';
import User from '../user/user.model.js';
import { StoreModel } from '../store/store.model.js';
import { MembershipModel } from '../membership/membership.model.js';
import { authorizeOrganizationAccess } from '../membership/membership.service.js';
import { EmployeeModel } from './employee.model.js';

const employeeUserFields = 'fullName username email mobile avatar';
const populateEmployee = (query) =>
  query
    .populate('userId', employeeUserFields)
    .populate('storeId', 'name code')
    .populate('organizationId', 'name');

const createStaffUser = async ({ fullName, username, email, password, mobile }) => {
  try {
    return await User.create({
      fullName,
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      ...(mobile ? { mobile } : {}),
      role: ROLES.EMPLOYEE,
      provider: 'local',
      isVerified: true,
      isApproved: true,
      isActive: true,
    });
  } catch (error) {
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      throw new ApiError(409, 'A user with this email, username, or mobile already exists');
    }
    throw error;
  }
};

const mapDuplicateKeyError = (error) => {
  if (!(error instanceof mongoose.mongo.MongoServerError) || error.code !== 11000) {
    return error;
  }
  if (error.keyPattern?.employeeCode) {
    return new ApiError(409, 'An employee with this code already exists in the organization');
  }
  return new ApiError(409, 'This user already has an employee membership in the organization');
};

export const createEmployee = async (employeeData, requesterId) => {
  const {
    organizationId,
    storeId,
    storeIds = [storeId],
    role,
    membershipStatus = 'active',
    userId,
    user,
  } = employeeData;
  await authorizeOrganizationAccess({
    userId: requesterId,
    organizationId,
    storeId,
    allowedRoles: ['owner', 'store_admin'],
  });

  const uniqueStoreIds = [...new Set(storeIds.map((id) => id.toString()))];
  if (!uniqueStoreIds.includes(storeId.toString())) {
    throw new ApiError(400, 'The employee store must be included in membership storeIds');
  }

  for (const assignedStoreId of uniqueStoreIds) {
    await authorizeOrganizationAccess({
      userId: requesterId,
      organizationId,
      storeId: assignedStoreId,
      allowedRoles: ['owner', 'store_admin'],
    });
    const store = await StoreModel.findOne({
      _id: assignedStoreId,
      organizationId,
      status: 'active',
    }).select('_id');
    if (!store) throw new ApiError(400, 'Employees can only be assigned to active stores');
  }

  let selectedUser;
  let createdUser = false;
  if (userId) {
    selectedUser = await User.findOne({
      _id: userId,
      isActive: true,
      isBlocked: false,
      isApproved: true,
    }).select('_id');
    if (!selectedUser) {
      throw new ApiError(404, 'The selected user was not found or is not active');
    }
    if (await MembershipModel.exists({ userId, organizationId })) {
      throw new ApiError(409, 'This user already has a membership in the organization');
    }
  } else {
    selectedUser = await createStaffUser(user);
    createdUser = true;
  }

  let createdMembership;
  let createdEmployee;
  try {
    createdMembership = await MembershipModel.create({
      userId: selectedUser._id,
      organizationId,
      storeIds: uniqueStoreIds,
      role,
      status: membershipStatus,
    });
    createdEmployee = await EmployeeModel.create({
      organizationId,
      storeId,
      userId: selectedUser._id,
      employeeCode: employeeData.employeeCode,
      designation: employeeData.designation,
      salary: employeeData.salary,
      joiningDate: employeeData.joiningDate,
      status: employeeData.status,
    });
  } catch (error) {
    if (createdEmployee) await EmployeeModel.deleteOne({ _id: createdEmployee._id });
    if (createdMembership) await MembershipModel.deleteOne({ _id: createdMembership._id });
    if (createdUser) await User.deleteOne({ _id: selectedUser._id });
    throw mapDuplicateKeyError(error);
  }

  return populateEmployee(EmployeeModel.findById(createdEmployee._id));
};

export const listEmployees = async ({ userId, organizationId, storeId }) => {
  const { allowedStoreIds } = await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
  });
  const query = { organizationId };
  if (storeId) query.storeId = storeId;
  else if (allowedStoreIds) query.storeId = { $in: allowedStoreIds };
  return populateEmployee(EmployeeModel.find(query).sort({ createdAt: -1 }));
};

export const getEmployee = async ({ userId, organizationId, employeeId }) => {
  const employee = await EmployeeModel.findOne({ _id: employeeId, organizationId }).select(
    'storeId',
  );
  if (!employee) throw new ApiError(404, 'Employee was not found');
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId: employee.storeId,
  });
  return populateEmployee(EmployeeModel.findById(employeeId));
};
