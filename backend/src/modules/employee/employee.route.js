import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import {
  addEmployee,
  getEmployeeById,
  getEmployees,
  getMyEmployeeProfile,
  modifyEmployee,
  removeEmployee,
} from './employee.controller.js';
import {
  createEmployeeValidation,
  getEmployeeValidation,
  listEmployeesValidation,
  updateEmployeeValidation,
  deleteEmployeeValidation,
} from './employee.validate.js';

const employeeRouter = Router();

employeeRouter.use(verifyJWT);
employeeRouter
  .route('/')
  .get(listEmployeesValidation, getEmployees)
  .post(createEmployeeValidation, addEmployee);
employeeRouter.get('/me', getMyEmployeeProfile);
employeeRouter
  .route('/:employeeId')
  .get(getEmployeeValidation, getEmployeeById)
  .patch(updateEmployeeValidation, modifyEmployee)
  .delete(deleteEmployeeValidation, removeEmployee);

export default employeeRouter;
