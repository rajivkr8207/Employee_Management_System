import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { receiveImage } from '../../middlewares/imageUpload.middleware.js';
import {
  addManualAttendance,
  checkInEmployee,
  checkOutEmployee,
  getAttendanceRecord,
  getAttendanceRecords,
  getMyAttendanceRecords,
  getTodayAttendanceStatus,
  updateAttendanceRecord,
} from './attendence.controller.js';
import {
  attendanceIdValidation,
  checkInValidation,
  listAttendanceValidation,
  manualAttendanceValidation,
  myAttendanceValidation,
  todayAttendanceValidation,
  updateAttendanceValidation,
} from './attendence.validate.js';

const attendanceRouter = Router();

attendanceRouter.use(verifyJWT);
attendanceRouter.post('/check-in', receiveImage, checkInValidation, checkInEmployee);
attendanceRouter.post('/check-out', receiveImage, checkInValidation, checkOutEmployee);
attendanceRouter.get('/today', todayAttendanceValidation, getTodayAttendanceStatus);
attendanceRouter.get('/mine', myAttendanceValidation, getMyAttendanceRecords);
attendanceRouter
  .route('/')
  .get(listAttendanceValidation, getAttendanceRecords)
  .post(manualAttendanceValidation, addManualAttendance);
attendanceRouter
  .route('/:attendanceId')
  .get(attendanceIdValidation, getAttendanceRecord)
  .patch(updateAttendanceValidation, updateAttendanceRecord);

export default attendanceRouter;
