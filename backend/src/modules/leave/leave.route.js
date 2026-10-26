import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import {
  cancelLeaveApplication,
  getLeaveApplication,
  getLeaveApplications,
  getMyLeaveApplications,
  reviewLeaveApplication,
  submitLeaveApplication,
} from './leave.controller.js';
import {
  createLeaveValidation,
  getLeaveValidation,
  listLeavesValidation,
  myLeavesValidation,
  reviewLeaveValidation,
} from './leave.validate.js';

const leaveRouter = Router();

leaveRouter.use(verifyJWT);
leaveRouter.post('/', createLeaveValidation, submitLeaveApplication);
leaveRouter.get('/mine', myLeavesValidation, getMyLeaveApplications);
leaveRouter.get('/', listLeavesValidation, getLeaveApplications);
leaveRouter
  .route('/:leaveId')
  .get(getLeaveValidation, getLeaveApplication)
  .delete(getLeaveValidation, cancelLeaveApplication);
leaveRouter.patch('/:leaveId/review', reviewLeaveValidation, reviewLeaveApplication);

export default leaveRouter;
