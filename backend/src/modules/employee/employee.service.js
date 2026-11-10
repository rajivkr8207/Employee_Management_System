import mongoose from 'mongoose';
import { ROLES } from '../../constants/roles.js';
import { ApiError } from '../../utils/ApiError.js';
import User from '../user/user.model.js';
import { StoreModel } from '../store/store.model.js';
import { MembershipModel } from '../membership/membership.model.js';
import { authorizeOrganizationAccess } from '../membership/membership.service.js';
import { EmployeeModel } from './employee.model.js';
import crypto from 'crypto';

const employeeUserFields = 'fullName username email mobile avatar role';
const populateEmployee = (query) =>
  query
    .populate('userId', employeeUserFields)
    .populate('storeId', 'name code')
    .populate('organizationId', 'name');

const createStaffUser = async (
  { fullName, username, email, password, mobile },
  role = ROLES.EMPLOYEE,
) => {
  try {
    return await User.create({
      fullName,
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      ...(mobile ? { mobile } : {}),
      role: role === 'manager' || role === ROLES.MANAGER ? ROLES.MANAGER : ROLES.EMPLOYEE,
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
  const { storeId, role = 'employee', membershipStatus = 'active', userId, user } = employeeData;
  let { organizationId, storeIds } = employeeData;

  const requester = await User.findById(requesterId);
  if (!requester) throw new ApiError(401, 'User account was not found');

  const store = await StoreModel.findById(storeId);
  if (!store || store.status !== 'active') {
    throw new ApiError(404, 'The target store was not found or is not active');
  }

  if (!organizationId) {
    organizationId = store.organizationId;
  }
  if (!storeIds || !storeIds.length) {
    storeIds = [storeId];
  }

  // Hierarchy validation:
  // - Store Admin can create manager or employee on their OWN store
  // - Store Manager can ONLY create employee on their OWN assigned store
  if (requester.role === ROLES.STORE_ADMIN) {
    const isOwned = store.createdBy?.toString() === requesterId.toString();
    if (!isOwned) {
      await authorizeOrganizationAccess({
        userId: requesterId,
        organizationId,
        storeId,
        allowedRoles: ['owner', 'store_admin'],
      });
    }
  } else if (requester.role === ROLES.MANAGER) {
    if (role === 'manager' || role === ROLES.MANAGER) {
      throw new ApiError(
        403,
        'Store managers cannot create other store managers. Only store administrators can appoint managers.',
      );
    }
    const isAssigned = store.managerId?.toString() === requesterId.toString();
    if (!isAssigned) {
      const membership = await MembershipModel.findOne({
        userId: requesterId,
        storeIds: storeId,
        role: 'manager',
        status: 'active',
      });
      if (!membership) {
        throw new ApiError(403, 'You can only add employees to your own assigned store');
      }
    }
  } else if (requester.role === ROLES.ADMIN) {
    // Super admin permitted
  } else {
    throw new ApiError(403, 'You do not have permission to add staff to this store');
  }

  const uniqueStoreIds = [...new Set(storeIds.map((id) => id.toString()))];
  if (!uniqueStoreIds.includes(storeId.toString())) {
    throw new ApiError(400, 'The employee store must be included in membership storeIds');
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
    selectedUser = await createStaffUser(user, role);
    createdUser = true;
  }

  let createdMembership;
  let createdEmployee;
  try {
    createdMembership = await MembershipModel.create({
      userId: selectedUser._id,
      organizationId,
      storeIds: uniqueStoreIds,
      role: role === ROLES.MANAGER || role === 'manager' ? 'manager' : 'employee',
      status: membershipStatus,
    });

    const employeeCode =
      employeeData.employeeCode ||
      (role === 'manager' ? 'MGR-' : 'EMP-') + crypto.randomBytes(3).toString('hex').toUpperCase();

    createdEmployee = await EmployeeModel.create({
      organizationId,
      storeId,
      userId: selectedUser._id,
      employeeCode,
      designation: employeeData.designation || (role === 'manager' ? 'Store Manager' : 'Employee'),
      salary: employeeData.salary || 0,
      Dob: employeeData.Dob,
      joiningDate: employeeData.joiningDate,
      status: employeeData.status || 'active',
    });

    // If appointing a manager, set store.managerId
    if (role === 'manager' || role === ROLES.MANAGER) {
      store.managerId = selectedUser._id;
      await store.save();
    }
  } catch (error) {
    if (createdEmployee) await EmployeeModel.deleteOne({ _id: createdEmployee._id });
    if (createdMembership) await MembershipModel.deleteOne({ _id: createdMembership._id });
    if (createdUser) await User.deleteOne({ _id: selectedUser._id });
    throw mapDuplicateKeyError(error);
  }

  // Send onboarding credentials email
  if (createdUser && user?.password) {
    try {
      const Config = (await import('../../config/config.js')).default;
      const { MailService } = await import('../../services/mail.service.js');
      await new MailService().SendStaffCredentialsMail(
        selectedUser.email,
        selectedUser.fullName,
        role === 'manager' ? 'Store Manager' : 'Employee',
        store.name,
        user.password,
        `${Config.frontend_url || 'http://localhost:5173'}/login`,
      );
    } catch (err) {
      console.error('[Staff Credentials Mail Error]:', err.message);
    }
  }

  return populateEmployee(EmployeeModel.findById(createdEmployee._id));
};

export const listEmployees = async ({ userId, organizationId, storeId, page, limit }) => {
  const { allowedStoreIds } = await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
  });
  const query = { organizationId };
  if (storeId) query.storeId = storeId;
  else if (allowedStoreIds) query.storeId = { $in: allowedStoreIds };
  let q = EmployeeModel.find(query).sort({ createdAt: -1 });
  if (page && limit) {
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));
    q = q.skip((p - 1) * l).limit(l);
  }
  return populateEmployee(q);
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

export const getMyEmployee = async (userId) => {
  const employee = await EmployeeModel.findOne({ userId });
  if (!employee) throw new ApiError(404, 'Your employee profile was not found');
  return populateEmployee(EmployeeModel.findById(employee._id));
};

export const updateEmployee = async (employeeId, updateData, requesterId) => {
  const employee = await EmployeeModel.findById(employeeId).select('storeId organizationId userId');
  if (!employee) throw new ApiError(404, 'Employee was not found');

  await authorizeOrganizationAccess({
    userId: requesterId,
    organizationId: employee.organizationId,
    storeId: employee.storeId,
  });

  const allowed = ['designation', 'salary', 'Dob', 'joiningDate', 'status'];
  const updates = Object.fromEntries(
    Object.entries(updateData).filter(([k]) => allowed.includes(k)),
  );
  if (!Object.keys(updates).length) throw new ApiError(400, 'No valid fields provided to update');

  const updated = await EmployeeModel.findByIdAndUpdate(
    employeeId,
    { $set: updates },
    { new: true, runValidators: true },
  );
  return populateEmployee(EmployeeModel.findById(updated._id));
};

export const softDeleteEmployee = async (employeeId, requesterId) => {
  const employee = await EmployeeModel.findById(employeeId).select(
    'storeId organizationId userId status',
  );
  if (!employee) throw new ApiError(404, 'Employee was not found');

  await authorizeOrganizationAccess({
    userId: requesterId,
    organizationId: employee.organizationId,
    storeId: employee.storeId,
  });

  if (employee.status === 'terminated') throw new ApiError(409, 'Employee is already terminated');

  employee.status = 'terminated';
  await employee.save();
  return populateEmployee(EmployeeModel.findById(employee._id));
};
