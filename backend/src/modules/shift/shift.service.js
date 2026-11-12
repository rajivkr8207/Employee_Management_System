import { ApiError } from '../../utils/ApiError.js';
import { authorizeOrganizationAccess } from '../membership/membership.service.js';
import { StoreModel } from '../store/store.model.js';
import { ShiftModel } from './shift.model.js';
import { ShiftAssignmentModel } from './shift-assignment.model.js';
import { EmployeeModel } from '../employee/employee.model.js';
import { getOrSetCache, deleteCacheByPattern } from '../../utils/cache.js';

/** Invalidate cached shift data for an org/store pair. */
const invalidateShiftCache = (organizationId, storeId) =>
  Promise.all([
    deleteCacheByPattern(`shifts:list:${organizationId}:*`),
    storeId ? deleteCacheByPattern(`shifts:assign:${storeId}:*`) : Promise.resolve(),
  ]);

const populateShift = (query) =>
  query.populate('organizationId', 'name').populate('storeId', 'name code');

const pickShiftFields = (shiftData, fields) =>
  Object.fromEntries(
    fields
      .filter((field) => Object.hasOwn(shiftData, field))
      .map((field) => [field, shiftData[field]]),
  );

const getAccessibleShift = async ({ userId, organizationId, shiftId }) => {
  const shift = await ShiftModel.findOne({ _id: shiftId, organizationId }).select(
    'storeId name startTime endTime',
  );
  if (!shift) throw new ApiError(404, 'Shift was not found');
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId: shift.storeId,
    allowedRoles: ['owner', 'store_admin', 'manager'],
  });
  return shift;
};

const ensureUniqueShiftName = async ({ storeId, name, excludedShiftId }) => {
  const query = { storeId, name };
  if (excludedShiftId) query._id = { $ne: excludedShiftId };
  if (await ShiftModel.exists(query)) {
    throw new ApiError(409, 'A shift with this name already exists in the store');
  }
};

const populateAssignment = (query) =>
  query
    .populate({
      path: 'employeeId',
      select: 'employeeCode designation status userId',
      populate: { path: 'userId', select: 'fullName username email mobile' },
    })
    .populate('shiftId', 'name startTime endTime status')
    .populate('storeId', 'name code');

export const listShiftAssignments = async ({ userId, organizationId, storeId, date }) => {
  const { allowedStoreIds } = await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
    allowedRoles: ['owner', 'store_admin', 'manager'],
  });
  const query = { organizationId };
  if (storeId) query.storeId = storeId;
  else if (allowedStoreIds) query.storeId = { $in: allowedStoreIds };
  if (date) query.date = date;

  // Cache per-store daily assignment lookups (most common pattern)
  if (storeId && date) {
    return getOrSetCache(
      `shifts:assign:${storeId}:${date}`,
      () =>
        populateAssignment(ShiftAssignmentModel.find(query).sort({ date: 1, createdAt: 1 })).lean(),
      900, // 15 min
    );
  }

  return populateAssignment(ShiftAssignmentModel.find(query).sort({ date: 1, createdAt: 1 }));
};

export const createShiftAssignment = async (assignmentData, userId) => {
  const { organizationId, storeId, employeeId, shiftId, date } = assignmentData;
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
    allowedRoles: ['owner', 'store_admin', 'manager'],
  });
  const [store, employee, shift] = await Promise.all([
    StoreModel.exists({ _id: storeId, organizationId, status: 'active' }),
    EmployeeModel.exists({
      _id: employeeId,
      organizationId,
      storeId,
      status: 'active',
    }),
    ShiftModel.exists({ _id: shiftId, organizationId, storeId, status: 'active' }),
  ]);
  if (!store) throw new ApiError(400, 'Schedules can only be assigned in an active store');
  if (!employee) throw new ApiError(404, 'Active employee was not found in this store');
  if (!shift) throw new ApiError(404, 'Active shift was not found in this store');

  try {
    const assignment = await ShiftAssignmentModel.create({
      organizationId,
      storeId,
      employeeId,
      shiftId,
      date,
      createdBy: userId,
    });
    await invalidateShiftCache(organizationId, storeId);
    return populateAssignment(ShiftAssignmentModel.findById(assignment._id));
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'This employee already has a scheduled shift for this date');
    }
    throw error;
  }
};

export const deleteShiftAssignment = async ({ userId, organizationId, assignmentId }) => {
  const assignment = await ShiftAssignmentModel.findOne({ _id: assignmentId, organizationId })
    .select('storeId')
    .lean();
  if (!assignment) throw new ApiError(404, 'Shift assignment was not found');
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId: assignment.storeId,
    allowedRoles: ['owner', 'store_admin', 'manager'],
  });
  await ShiftAssignmentModel.deleteOne({ _id: assignmentId, organizationId });
  await invalidateShiftCache(organizationId, assignment.storeId);
};

export const createShift = async (shiftData, userId) => {
  const { organizationId, storeId } = shiftData;
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
    allowedRoles: ['owner', 'store_admin', 'manager'],
  });
  const activeStore = await StoreModel.exists({
    _id: storeId,
    organizationId,
    status: 'active',
  });
  if (!activeStore) throw new ApiError(400, 'Shifts can only be created for active stores');

  await ensureUniqueShiftName({ storeId, name: shiftData.name });
  const shift = await ShiftModel.create({
    organizationId,
    storeId,
    ...pickShiftFields(shiftData, ['name', 'startTime', 'endTime', 'status']),
  });
  await invalidateShiftCache(organizationId, storeId);
  return populateShift(ShiftModel.findById(shift._id));
};

export const listShifts = async ({ userId, organizationId, storeId }) => {
  const { allowedStoreIds } = await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
    allowedRoles: ['owner', 'store_admin', 'manager'],
  });
  const query = { organizationId };
  if (storeId) query.storeId = storeId;
  else if (allowedStoreIds) query.storeId = { $in: allowedStoreIds };

  // Cache per org+store for 30 minutes
  const cacheKey = `shifts:list:${organizationId}:${storeId || 'all'}`;
  return getOrSetCache(
    cacheKey,
    () => populateShift(ShiftModel.find(query).sort({ createdAt: -1 })).lean(),
    1800,
  );
};

export const getShift = async ({ userId, organizationId, shiftId }) => {
  await getAccessibleShift({ userId, organizationId, shiftId });
  return populateShift(ShiftModel.findOne({ _id: shiftId, organizationId }));
};

export const updateShift = async ({ userId, organizationId, shiftId, shiftData }) => {
  const currentShift = await getAccessibleShift({ userId, organizationId, shiftId });
  const update = pickShiftFields(shiftData, ['name', 'startTime', 'endTime', 'status']);
  const name = update.name ?? currentShift.name;
  const startTime = update.startTime ?? currentShift.startTime;
  const endTime = update.endTime ?? currentShift.endTime;

  if (startTime === endTime) {
    throw new ApiError(400, 'Shift start time and end time must be different');
  }
  if (Object.hasOwn(update, 'name')) {
    await ensureUniqueShiftName({
      storeId: currentShift.storeId,
      name,
      excludedShiftId: shiftId,
    });
  }

  const shift = await populateShift(
    ShiftModel.findOneAndUpdate(
      { _id: shiftId, organizationId },
      { $set: update },
      { new: true, runValidators: true },
    ),
  );
  if (!shift) throw new ApiError(404, 'Shift was not found');
  await invalidateShiftCache(organizationId, currentShift.storeId);
  return shift;
};

export const deleteShift = async ({ userId, organizationId, shiftId }) => {
  const currentShift = await getAccessibleShift({ userId, organizationId, shiftId });
  const shift = await ShiftModel.findOneAndDelete({ _id: shiftId, organizationId });
  if (!shift) throw new ApiError(404, 'Shift was not found');
  await invalidateShiftCache(organizationId, currentShift.storeId);
};
