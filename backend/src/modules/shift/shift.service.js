import { ApiError } from '../../utils/ApiError.js';
import { authorizeOrganizationAccess } from '../membership/membership.service.js';
import { StoreModel } from '../store/store.model.js';
import { ShiftModel } from './shift.model.js';

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
  return populateShift(ShiftModel.find(query).sort({ createdAt: -1 }));
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
  return shift;
};

export const deleteShift = async ({ userId, organizationId, shiftId }) => {
  await getAccessibleShift({ userId, organizationId, shiftId });
  const shift = await ShiftModel.findOneAndDelete({ _id: shiftId, organizationId });
  if (!shift) throw new ApiError(404, 'Shift was not found');
};
