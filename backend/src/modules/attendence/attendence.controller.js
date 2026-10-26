import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  checkIn,
  checkOut,
  correctAttendance,
  createManualAttendance,
  getAttendance,
  getMyAttendance,
  listAttendance,
} from './attendence.service.js';

export const checkInEmployee = asyncHandler(async (req, res) => {
  const attendance = await checkIn({
    userId: req.user.id,
    organizationId: req.body.organizationId,
    location: req.body.location,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, { attendance }, 'Check-in recorded successfully'));
});

export const checkOutEmployee = asyncHandler(async (req, res) => {
  const attendance = await checkOut({
    userId: req.user.id,
    organizationId: req.body.organizationId,
    location: req.body.location,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { attendance }, 'Check-out recorded successfully'));
});

export const getMyAttendanceRecords = asyncHandler(async (req, res) => {
  const attendance = await getMyAttendance({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    date: req.query.date,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { attendance }, 'Your attendance records fetched successfully'));
});

export const getAttendanceRecords = asyncHandler(async (req, res) => {
  const attendance = await listAttendance({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    storeId: req.query.storeId,
    employeeId: req.query.employeeId,
    date: req.query.date,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { attendance }, 'Attendance records fetched successfully'));
});

export const getAttendanceRecord = asyncHandler(async (req, res) => {
  const attendance = await getAttendance({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    attendanceId: req.params.attendanceId,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { attendance }, 'Attendance record fetched successfully'));
});

export const addManualAttendance = asyncHandler(async (req, res) => {
  const attendance = await createManualAttendance({
    userId: req.user.id,
    attendanceData: req.body,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, { attendance }, 'Manual attendance recorded successfully'));
});

export const updateAttendanceRecord = asyncHandler(async (req, res) => {
  const attendance = await correctAttendance({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    attendanceId: req.params.attendanceId,
    correction: req.body,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { attendance }, 'Attendance record corrected successfully'));
});
