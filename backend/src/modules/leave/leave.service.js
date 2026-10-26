import { ApiError } from '../../utils/ApiError.js';
import { EmployeeModel } from '../employee/employee.model.js';
import { MembershipModel } from '../membership/membership.model.js';
import { authorizeOrganizationAccess } from '../membership/membership.service.js';
import { organizationModel } from '../organization/organization.model.js';
import { StoreModel } from '../store/store.model.js';
import { LeaveModel } from './leave.model.js';

const managerRoles = ['owner', 'store_admin', 'manager'];
const populateLeave = (query) =>
  query
    .populate({
      path: 'employeeId',
      select: 'employeeCode designation storeId userId',
      populate: { path: 'userId', select: 'fullName username email' },
    })
    .populate('approvedBy', 'fullName username')
    .populate('organizationId', 'name');

const getActiveEmployeeForUser = async ({ userId, organizationId }) => {
  const employee = await EmployeeModel.findOne({
    organizationId,
    userId,
    status: 'active',
  });
  if (!employee) throw new ApiError(404, 'No active employee record was found');

  const [organization, membership, store] = await Promise.all([
    organizationModel
      .findOne({ _id: organizationId, status: 'active', verificationStatus: 'approved' })
      .select('ownerId'),
    MembershipModel.findOne({ userId, organizationId, status: 'active' }).select('storeIds'),
    StoreModel.findOne({
      _id: employee.storeId,
      organizationId,
      status: 'active',
    }).select('_id'),
  ]);
  if (!organization) throw new ApiError(403, 'Organization is not active and approved');
  const isOwner = organization.ownerId.toString() === userId.toString();
  if (!isOwner && !membership)
    throw new ApiError(403, 'An active organization membership is required');
  if (
    !isOwner &&
    !membership.storeIds.some((storeId) => storeId.toString() === employee.storeId.toString())
  ) {
    throw new ApiError(403, 'You do not have access to the employee store');
  }
  if (!store) throw new ApiError(403, 'Employee store is not active');
  return employee;
};

const getManagedLeave = async ({ userId, organizationId, leaveId }) => {
  const leave = await LeaveModel.findOne({ _id: leaveId, organizationId }).select('employeeId');
  if (!leave) throw new ApiError(404, 'Leave application was not found');
  const employee = await EmployeeModel.findOne({
    _id: leave.employeeId,
    organizationId,
  }).select('storeId');
  if (!employee) throw new ApiError(404, 'Employee was not found');
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId: employee.storeId,
    allowedRoles: managerRoles,
  });
  return leave;
};

const getLeaveDateRange = ({ from, to }) => {
  if (!from && !to) return undefined;
  return {
    start: from ? new Date(`${from}T00:00:00.000Z`) : undefined,
    end: to ? new Date(`${to}T00:00:00.000Z`) : undefined,
  };
};

export const applyForLeave = async ({ userId, leaveData }) => {
  const { organizationId, from, to, reason } = leaveData;
  const employee = await getActiveEmployeeForUser({ userId, organizationId });
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  const conflictingLeave = await LeaveModel.exists({
    employeeId: employee._id,
    status: { $in: ['pending', 'approved'] },
    from: { $lte: end },
    to: { $gte: start },
  });
  if (conflictingLeave) {
    throw new ApiError(409, 'A pending or approved leave already overlaps these dates');
  }
  const leave = await LeaveModel.create({
    organizationId,
    employeeId: employee._id,
    from: start,
    to: end,
    reason,
  });
  return populateLeave(LeaveModel.findById(leave._id));
};

export const getMyLeaves = async ({ userId, organizationId, status, from, to }) => {
  const employee = await getActiveEmployeeForUser({ userId, organizationId });
  const query = { organizationId, employeeId: employee._id };
  if (status) query.status = status;
  const dateRange = getLeaveDateRange({ from, to });
  if (dateRange?.start) query.to = { $gte: dateRange.start };
  if (dateRange?.end) query.from = { $lte: dateRange.end };
  return populateLeave(LeaveModel.find(query).sort({ from: -1, createdAt: -1 }));
};

export const listLeaves = async ({
  userId,
  organizationId,
  storeId,
  employeeId,
  status,
  from,
  to,
}) => {
  const { allowedStoreIds } = await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
    allowedRoles: managerRoles,
  });
  const query = { organizationId };
  if (storeId)
    query.employeeId = {
      $in: await EmployeeModel.find({ organizationId, storeId }).distinct('_id'),
    };
  else if (allowedStoreIds) {
    query.employeeId = {
      $in: await EmployeeModel.find({
        organizationId,
        storeId: { $in: allowedStoreIds },
      }).distinct('_id'),
    };
  }
  if (employeeId) {
    const employee = await EmployeeModel.findOne({ _id: employeeId, organizationId }).select(
      'storeId',
    );
    if (!employee) throw new ApiError(404, 'Employee was not found');
    await authorizeOrganizationAccess({
      userId,
      organizationId,
      storeId: employee.storeId,
      allowedRoles: managerRoles,
    });
    query.employeeId = employee._id;
  }
  if (status) query.status = status;
  const dateRange = getLeaveDateRange({ from, to });
  if (dateRange?.start) query.to = { $gte: dateRange.start };
  if (dateRange?.end) query.from = { $lte: dateRange.end };
  return populateLeave(LeaveModel.find(query).sort({ from: -1, createdAt: -1 }));
};

export const getLeave = async ({ userId, organizationId, leaveId }) => {
  const leave = await LeaveModel.findOne({ _id: leaveId, organizationId }).select('employeeId');
  if (!leave) throw new ApiError(404, 'Leave application was not found');
  const employee = await EmployeeModel.findOne({
    _id: leave.employeeId,
    organizationId,
  }).select('storeId userId');
  if (!employee) throw new ApiError(404, 'Employee was not found');

  if (employee.userId.toString() !== userId.toString()) {
    await authorizeOrganizationAccess({
      userId,
      organizationId,
      storeId: employee.storeId,
      allowedRoles: managerRoles,
    });
  } else {
    await getActiveEmployeeForUser({ userId, organizationId });
  }
  return populateLeave(LeaveModel.findOne({ _id: leaveId, organizationId }));
};

export const reviewLeave = async ({ userId, organizationId, leaveId, status }) => {
  await getManagedLeave({ userId, organizationId, leaveId });
  const leave = await LeaveModel.findOneAndUpdate(
    { _id: leaveId, organizationId, status: 'pending' },
    {
      $set: {
        status,
        approvedBy: status === 'approved' ? userId : null,
        approvedAt: status === 'approved' ? new Date() : null,
      },
    },
    { returnDocument: 'after', runValidators: true },
  );
  if (!leave) throw new ApiError(409, 'Only pending leave applications can be reviewed');
  return populateLeave(LeaveModel.findById(leave._id));
};

export const cancelLeave = async ({ userId, organizationId, leaveId }) => {
  const employee = await getActiveEmployeeForUser({ userId, organizationId });
  const leave = await LeaveModel.findOneAndDelete({
    _id: leaveId,
    organizationId,
    employeeId: employee._id,
    status: 'pending',
  });
  if (!leave) {
    const existing = await LeaveModel.exists({ _id: leaveId, organizationId });
    if (!existing) throw new ApiError(404, 'Leave application was not found');
    throw new ApiError(409, 'Only your pending leave applications can be cancelled');
  }
};
