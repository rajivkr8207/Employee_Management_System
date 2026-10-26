import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createShift, deleteShift, getShift, listShifts, updateShift } from './shift.service.js';

export const addShift = asyncHandler(async (req, res) => {
  const shift = await createShift(req.body, req.user.id);
  return res.status(201).json(new ApiResponse(201, { shift }, 'Shift created successfully'));
});

export const getShifts = asyncHandler(async (req, res) => {
  const shifts = await listShifts({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    storeId: req.query.storeId,
  });
  return res.status(200).json(new ApiResponse(200, { shifts }, 'Shifts fetched successfully'));
});

export const getShiftById = asyncHandler(async (req, res) => {
  const shift = await getShift({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    shiftId: req.params.shiftId,
  });
  return res.status(200).json(new ApiResponse(200, { shift }, 'Shift fetched successfully'));
});

export const editShift = asyncHandler(async (req, res) => {
  const shift = await updateShift({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    shiftId: req.params.shiftId,
    shiftData: req.body,
  });
  return res.status(200).json(new ApiResponse(200, { shift }, 'Shift updated successfully'));
});

export const removeShift = asyncHandler(async (req, res) => {
  await deleteShift({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    shiftId: req.params.shiftId,
  });
  return res.status(200).json(new ApiResponse(200, {}, 'Shift deleted successfully'));
});
