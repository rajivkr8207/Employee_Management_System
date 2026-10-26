import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { MembershipModel } from '../membership/membership.model.js';
import { authorizeOrganizationAccess } from '../membership/membership.service.js';
import { organizationModel } from '../organization/organization.model.js';
import { StoreModel } from '../store/store.model.js';
import { EmployeeModel } from '../employee/employee.model.js';
import { AttendanceModel } from './attendence.model.js';

const attendanceRoles = ['owner', 'store_admin', 'manager'];
const attendanceEmployeeFields = 'employeeCode designation userId';
const populateAttendance = (query) =>
  query
    .populate('employeeId', attendanceEmployeeFields)
    .populate('storeId', 'name code')
    .populate('organizationId', 'name')
    .populate('correctedBy', 'fullName username');

const getUtcDay = (date = new Date()) => {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);
  return day;
};

const getDateRange = ({ date, fromDate, toDate }) => {
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { $gte: start, $lt: end };
  }
  if (!fromDate && !toDate) return undefined;

  const start = fromDate
    ? new Date(`${fromDate}T00:00:00.000Z`)
    : new Date('1970-01-01T00:00:00.000Z');
  const end = toDate ? new Date(`${toDate}T00:00:00.000Z`) : new Date();
  if (toDate) end.setUTCDate(end.getUTCDate() + 1);
  if (start > end) throw new ApiError(400, 'fromDate cannot be later than toDate');
  return { $gte: start, $lt: end };
};

const getActiveEmployee = async ({ userId, organizationId }) => {
  const employee = await EmployeeModel.findOne({
    organizationId,
    userId,
    status: 'active',
  });
  if (!employee) throw new ApiError(404, 'No active employee record was found');

  const [organization, membership, store] = await Promise.all([
    organizationModel
      .findOne({
        _id: organizationId,
        status: 'active',
        verificationStatus: 'approved',
      })
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

const getManagedEmployee = async ({ userId, organizationId, employeeId }) => {
  const employee = await EmployeeModel.findOne({ _id: employeeId, organizationId });
  if (!employee) throw new ApiError(404, 'Employee was not found');
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId: employee.storeId,
    allowedRoles: attendanceRoles,
  });
  return employee;
};

const mapDuplicateAttendance = (error) => {
  if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
    return new ApiError(409, 'Attendance has already been recorded for this employee today');
  }
  return error;
};

export const checkIn = async ({ userId, organizationId, location }) => {
  const employee = await getActiveEmployee({ userId, organizationId });
  const date = getUtcDay();
  try {
    const attendance = await AttendanceModel.create({
      organizationId,
      storeId: employee.storeId,
      employeeId: employee._id,
      date,
      checkIn: new Date(),
      ...(location ? { checkInLocation: location } : {}),
      source: 'self',
      status: 'present',
    });
    return populateAttendance(AttendanceModel.findById(attendance._id));
  } catch (error) {
    throw mapDuplicateAttendance(error);
  }
};

export const checkOut = async ({ userId, organizationId, location }) => {
  const employee = await getActiveEmployee({ userId, organizationId });
  const date = getUtcDay();
  const update = { checkOut: new Date() };
  if (location) update.checkOutLocation = location;

  const attendance = await populateAttendance(
    AttendanceModel.findOneAndUpdate(
      {
        employeeId: employee._id,
        date,
        checkIn: { $ne: null },
        checkOut: null,
      },
      { $set: update },
      { returnDocument: 'after', runValidators: true },
    ),
  );
  if (attendance) return attendance;

  const existing = await AttendanceModel.findOne({ employeeId: employee._id, date }).select(
    'checkIn checkOut',
  );
  if (!existing || !existing.checkIn) {
    throw new ApiError(400, 'Check in before checking out');
  }
  throw new ApiError(409, 'You have already checked out today');
};

export const getMyAttendance = async ({ userId, organizationId, date, fromDate, toDate }) => {
  const employee = await getActiveEmployee({ userId, organizationId });
  const query = { employeeId: employee._id, organizationId };
  const dateRange = getDateRange({ date, fromDate, toDate });
  if (dateRange) query.date = dateRange;
  return populateAttendance(AttendanceModel.find(query).sort({ date: -1 }));
};

export const listAttendance = async ({
  userId,
  organizationId,
  storeId,
  employeeId,
  date,
  fromDate,
  toDate,
}) => {
  const { allowedStoreIds } = await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
    allowedRoles: attendanceRoles,
  });
  const query = { organizationId };
  if (storeId) query.storeId = storeId;
  else if (allowedStoreIds) query.storeId = { $in: allowedStoreIds };

  if (employeeId) {
    const employee = await getManagedEmployee({ userId, organizationId, employeeId });
    query.employeeId = employee._id;
  }
  const dateRange = getDateRange({ date, fromDate, toDate });
  if (dateRange) query.date = dateRange;
  return populateAttendance(AttendanceModel.find(query).sort({ date: -1, createdAt: -1 }));
};

export const getAttendance = async ({ userId, organizationId, attendanceId }) => {
  const attendance = await AttendanceModel.findOne({ _id: attendanceId, organizationId }).select(
    'storeId',
  );
  if (!attendance) throw new ApiError(404, 'Attendance record was not found');
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId: attendance.storeId,
    allowedRoles: attendanceRoles,
  });
  return populateAttendance(AttendanceModel.findOne({ _id: attendanceId, organizationId }));
};

export const createManualAttendance = async ({ userId, attendanceData }) => {
  const { organizationId, employeeId, date, checkIn, checkOut, status, correctionReason } =
    attendanceData;
  const employee = await getManagedEmployee({ userId, organizationId, employeeId });
  if (checkIn && checkOut && checkOut <= checkIn) {
    throw new ApiError(400, 'Check-out time must be later than check-in time');
  }

  try {
    const attendance = await AttendanceModel.create({
      organizationId,
      storeId: employee.storeId,
      employeeId: employee._id,
      date: new Date(`${date}T00:00:00.000Z`),
      checkIn: checkIn ?? null,
      checkOut: checkOut ?? null,
      status: status ?? 'present',
      source: 'manual',
      correctedBy: userId,
      correctionReason,
    });
    return populateAttendance(AttendanceModel.findById(attendance._id));
  } catch (error) {
    throw mapDuplicateAttendance(error);
  }
};

export const correctAttendance = async ({ userId, organizationId, attendanceId, correction }) => {
  const attendance = await AttendanceModel.findOne({ _id: attendanceId, organizationId });
  if (!attendance) throw new ApiError(404, 'Attendance record was not found');
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId: attendance.storeId,
    allowedRoles: attendanceRoles,
  });

  const checkIn = Object.hasOwn(correction, 'checkIn') ? correction.checkIn : attendance.checkIn;
  const checkOut = Object.hasOwn(correction, 'checkOut')
    ? correction.checkOut
    : attendance.checkOut;
  if (checkIn && checkOut && checkOut <= checkIn) {
    throw new ApiError(400, 'Check-out time must be later than check-in time');
  }

  for (const field of ['checkIn', 'checkOut', 'status', 'correctionReason']) {
    if (Object.hasOwn(correction, field)) attendance[field] = correction[field];
  }
  attendance.source = 'manual';
  attendance.correctedBy = userId;
  await attendance.save();
  return populateAttendance(AttendanceModel.findById(attendanceId));
};
