import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { addShift, editShift, getShiftById, getShifts, removeShift } from './shift.controller.js';
import {
  createShiftValidation,
  getShiftValidation,
  listShiftsValidation,
  updateShiftValidation,
} from './shift.validate.js';

const shiftRouter = Router();

shiftRouter.use(verifyJWT);
shiftRouter.route('/').get(listShiftsValidation, getShifts).post(createShiftValidation, addShift);
shiftRouter
  .route('/:shiftId')
  .get(getShiftValidation, getShiftById)
  .patch(updateShiftValidation, editShift)
  .delete(getShiftValidation, removeShift);

export default shiftRouter;
