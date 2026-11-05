import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import {
  addShift,
  addShiftAssignment,
  editShift,
  getShiftAssignments,
  getShiftById,
  getShifts,
  removeShift,
  removeShiftAssignment,
} from './shift.controller.js';
import {
  createAssignmentValidation,
  createShiftValidation,
  getShiftValidation,
  listAssignmentsValidation,
  listShiftsValidation,
  shiftAssignmentIdValidation,
  updateShiftValidation,
} from './shift.validate.js';

const shiftRouter = Router();

shiftRouter.use(verifyJWT);
shiftRouter
  .route('/assignments')
  .get(listAssignmentsValidation, getShiftAssignments)
  .post(createAssignmentValidation, addShiftAssignment);
shiftRouter.delete(
  '/assignments/:assignmentId',
  shiftAssignmentIdValidation,
  removeShiftAssignment,
);
shiftRouter.route('/').get(listShiftsValidation, getShifts).post(createShiftValidation, addShift);
shiftRouter
  .route('/:shiftId')
  .get(getShiftValidation, getShiftById)
  .patch(updateShiftValidation, editShift)
  .delete(getShiftValidation, removeShift);

export default shiftRouter;
