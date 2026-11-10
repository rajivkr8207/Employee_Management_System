import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createNotification,
  notifyStoreAdminsOnAttendance,
} from '../notification/notification.service.js';
import {
  checkIn,
  checkOut,
  correctAttendance,
  createManualAttendance,
  getAttendance,
  getMyAttendance,
  getTodayAttendance,
  listAttendance,
} from './attendence.service.js';

export const checkInEmployee = asyncHandler(async (req, res) => {
  try {
    const attendance = await checkIn({
      userId: req.user.id,
      organizationId: req.body.organizationId,
      location: getRequestLocation(req.body),
      imageBuffer: req.file?.buffer,
    });

    const storeName = attendance?.storeId?.name || 'store';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    createNotification({
      userId: req.user.id,
      title: 'Check-in Successful',
      message: `Checked in successfully at ${timeStr} (${storeName}).`,
      type: 'attendance',
      actionUrl: '/employee/dashboard',
    }).catch(() => {});

    notifyStoreAdminsOnAttendance({
      organizationId: req.body.organizationId,
      storeId: attendance?.storeId?._id || attendance?.storeId,
      employeeName: req.user.fullName || 'Employee',
      type: 'checkIn',
      timeStr,
      storeName,
    }).catch(() => {});

    return res
      .status(201)
      .json(new ApiResponse(201, { attendance }, 'Check-in recorded successfully'));
  } catch (error) {
    await createNotification({
      userId: req.user.id,
      title: 'Check-in Failed',
      message: `Check-in failed: ${error.message || 'Verification failed'}`,
      type: 'alert',
      actionUrl: '/employee/dashboard',
    }).catch(() => {});

    throw error;
  }
});

export const checkOutEmployee = asyncHandler(async (req, res) => {
  try {
    const attendance = await checkOut({
      userId: req.user.id,
      organizationId: req.body.organizationId,
      location: getRequestLocation(req.body),
      imageBuffer: req.file?.buffer,
    });

    const storeName = attendance?.storeId?.name || 'store';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    createNotification({
      userId: req.user.id,
      title: 'Check-out Successful',
      message: `Checked out successfully at ${timeStr} (${storeName}).`,
      type: 'attendance',
      actionUrl: '/employee/dashboard',
    }).catch(() => {});

    notifyStoreAdminsOnAttendance({
      organizationId: req.body.organizationId,
      storeId: attendance?.storeId?._id || attendance?.storeId,
      employeeName: req.user.fullName || 'Employee',
      type: 'checkOut',
      timeStr,
      storeName,
    }).catch(() => {});

    return res
      .status(200)
      .json(new ApiResponse(200, { attendance }, 'Check-out recorded successfully'));
  } catch (error) {
    await createNotification({
      userId: req.user.id,
      title: 'Check-out Failed',
      message: `Check-out failed: ${error.message || 'Verification failed'}`,
      type: 'alert',
      actionUrl: '/employee/dashboard',
    }).catch(() => {});

    throw error;
  }
});

const getRequestLocation = (body) =>
  body.location || { lat: Number(body.lat), lng: Number(body.lng) };

export const getTodayAttendanceStatus = asyncHandler(async (req, res) => {
  const status = await getTodayAttendance({
    userId: req.user.id,
    organizationId: req.query.organizationId,
    location:
      req.query.lat !== undefined
        ? { lat: Number(req.query.lat), lng: Number(req.query.lng) }
        : undefined,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, status, "Today's shift and attendance status fetched successfully"));
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
