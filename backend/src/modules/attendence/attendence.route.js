import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import {
  addManualAttendance,
  checkInEmployee,
  checkOutEmployee,
  getAttendanceRecord,
  getAttendanceRecords,
  getMyAttendanceRecords,
  updateAttendanceRecord,
} from './attendence.controller.js';
import {
  attendanceIdValidation,
  checkInValidation,
  listAttendanceValidation,
  manualAttendanceValidation,
  myAttendanceValidation,
  updateAttendanceValidation,
} from './attendence.validate.js';

const attendanceRouter = Router();

attendanceRouter.use(verifyJWT);
attendanceRouter.post('/check-in', checkInValidation, checkInEmployee);
attendanceRouter.post('/check-out', checkInValidation, checkOutEmployee);
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
