import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { MembershipModel } from '../membership/membership.model.js';
import { authorizeOrganizationAccess } from '../membership/membership.service.js';
import { organizationModel } from '../organization/organization.model.js';
import { StoreModel } from '../store/store.model.js';
import { EmployeeModel } from '../employee/employee.model.js';
import { ShiftAssignmentModel } from '../shift/shift-assignment.model.js';
import User from '../user/user.model.js';
import { AttendanceModel } from './attendence.model.js';
import { createFaceEmbedding, matchesFaceEmbedding } from '../../services/faceRecognition.service.js';

const attendanceRoles = ['owner', 'store_admin', 'manager'];
const attendanceEmployeeFields = 'employeeCode designation userId';
const populateAttendance = (query) =>
  query
    .populate('employeeId', attendanceEmployeeFields)
    .populate('storeId', 'name code')
    .populate('organizationId', 'name')
    .populate('correctedBy', 'fullName username');

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

const getDateParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
};

const getDateKey = (date, timeZone) => {
  const { year, month, day } = getDateParts(date, timeZone);
  return `${year}-${month}-${day}`;
};

const getTodayContext = async ({ userId, organizationId, location }) => {
  const employee = await getActiveEmployee({ userId, organizationId });
  const store = await StoreModel.findById(employee.storeId).select('name location timeZone');
  if (!store) throw new ApiError(404, 'Employee store was not found');
  const timeZone = store.timeZone || 'Asia/Kolkata';
  const now = new Date();
  const dateKey = getDateKey(now, timeZone);
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  const [assignment, attendance, user] = await Promise.all([
    ShiftAssignmentModel.findOne({ employeeId: employee._id, date: dateKey }).populate(
      'shiftId',
      'name startTime endTime status',
    ),
    AttendanceModel.findOne({ employeeId: employee._id, date }),
    User.findById(employee.userId).select('+faceEmbedding'),
  ]);

  const exactDistance = location
    ? haversineDistance(location, { lat: store.location.lat, lng: store.location.lng })
    : null;
  const distanceMeters = exactDistance === null ? null : Math.round(exactDistance);
  const radius = store.location.radius ?? 100;
  const insideGeofence = exactDistance !== null && exactDistance <= radius;
  const shift = assignment?.shiftId?.status === 'active' ? assignment.shiftId : null;
  const start = shift ? getShiftDateTime(dateKey, shift.startTime, timeZone) : null;
  const endTime = shift ? getShiftDateTime(dateKey, shift.endTime, timeZone) : null;
  const end = start && endTime <= start ? addMinutes(endTime, 24 * 60) : endTime;
  const checkInWindow = start && now >= addMinutes(start, -30) && now <= addMinutes(start, 60);
  const checkOutWindow = end && now >= addMinutes(end, -30) && now <= addMinutes(end, 60);
  const canCheckIn = Boolean(shift && !attendance?.checkIn && checkInWindow && insideGeofence);
  const canCheckOut = Boolean(
    shift && attendance?.checkIn && !attendance?.checkOut && checkOutWindow && insideGeofence,
  );
  let reason = null;
  if (!shift) reason = 'No shift is assigned for today.';
  else if (!location) reason = 'Allow location access to check your distance from the store.';
  else if (!insideGeofence) reason = `You must be within ${radius} metres of your store.`;
  else if (!attendance?.checkIn && !checkInWindow)
    reason = 'Check-in is available from 30 minutes before to 1 hour after your shift starts.';
  else if (attendance?.checkIn && !attendance?.checkOut && !checkOutWindow)
    reason = 'Check-out is available from 30 minutes before to 1 hour after your shift ends.';
  else if (attendance?.checkIn && !attendance?.checkOut) reason = 'You are checked in.';
  else if (attendance?.checkOut) reason = 'Attendance is complete for today.';

  return {
    employee,
    date,
    store,
    assignment,
    attendance,
    faceEnrolled: user?.faceEmbedding?.length === 128,
    faceEmbedding: user?.faceEmbedding,
    distanceMeters,
    radius,
    insideGeofence,
    canCheckIn,
    canCheckOut,
    reason,
  };
};

const getShiftDateTime = (dateKey, time, timeZone) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const targetTime = Date.UTC(year, month - 1, day, hours, minutes);
  let timestamp = targetTime;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, value]),
    );
    const representedTime = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    );
    timestamp += targetTime - representedTime;
  }
  return new Date(timestamp);
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60_000);

const haversineDistance = (first, second) => {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDifference = radians(second.lat - first.lat);
  const longitudeDifference = radians(second.lng - first.lng);
  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(first.lat)) *
      Math.cos(radians(second.lat)) *
      Math.sin(longitudeDifference / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

export const getTodayAttendance = async ({ userId, organizationId, location }) => {
  const context = await getTodayContext({ userId, organizationId, location });
  return {
    date: context.date,
    shift: context.assignment?.shiftId?.status === 'active' ? context.assignment.shiftId : null,
    store: { name: context.store.name, radius: context.radius },
    attendance: context.attendance
      ? await populateAttendance(AttendanceModel.findById(context.attendance._id))
      : null,
    distanceMeters: context.distanceMeters,
    insideGeofence: context.insideGeofence,
    faceEnrolled: context.faceEnrolled,
    canCheckIn: context.canCheckIn,
    canCheckOut: context.canCheckOut,
    reason: context.reason,
  };
};

const assertAttendanceActionAllowed = async ({
  userId,
  organizationId,
  location,
  imageBuffer,
  action,
}) => {
  if (!location) throw new ApiError(400, 'Your current location is required for attendance');
  const context = await getTodayContext({ userId, organizationId, location });
  const allowed = action === 'check-in' ? context.canCheckIn : context.canCheckOut;
  if (!context.assignment?.shiftId) throw new ApiError(400, 'No shift is assigned for today');
  if (!context.insideGeofence) {
    throw new ApiError(403, `You must be within ${context.radius} metres of your store`);
  }
  if (!allowed) {
    if (action === 'check-in' && context.attendance?.checkIn) {
      throw new ApiError(409, 'You have already checked in today');
    }
    if (action === 'check-out' && !context.attendance?.checkIn) {
      throw new ApiError(400, 'Check in before checking out');
    }
    if (action === 'check-out' && context.attendance?.checkOut) {
      throw new ApiError(409, 'You have already checked out today');
    }
    throw new ApiError(400, context.reason || 'Attendance is not available at this time');
  }
  if (!context.faceEnrolled) {
    throw new ApiError(409, 'Enroll your face from the employee dashboard before taking attendance');
  }
  const candidateEmbedding = await createFaceEmbedding(imageBuffer);
  if (!matchesFaceEmbedding(candidateEmbedding, context.faceEmbedding)) {
    throw new ApiError(401, 'Face verification failed. Make sure the enrolled employee is in view');
  }
  return context;
};

export const checkIn = async ({ userId, organizationId, location, imageBuffer }) => {
  const { employee, date } = await assertAttendanceActionAllowed({
    userId,
    organizationId,
    location,
    imageBuffer,
    action: 'check-in',
  });
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

export const checkOut = async ({ userId, organizationId, location, imageBuffer }) => {
  const { employee, date } = await assertAttendanceActionAllowed({
    userId,
    organizationId,
    location,
    imageBuffer,
    action: 'check-out',
  });
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
