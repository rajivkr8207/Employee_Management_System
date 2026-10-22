import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { addEmployee, getEmployeeById, getEmployees } from './employee.controller.js';
import {
  createEmployeeValidation,
  getEmployeeValidation,
  listEmployeesValidation,
} from './employee.validate.js';

const employeeRouter = Router();

employeeRouter.use(verifyJWT);
employeeRouter
  .route('/')
  .get(listEmployeesValidation, getEmployees)
  .post(createEmployeeValidation, addEmployee);
employeeRouter.get('/:employeeId', getEmployeeValidation, getEmployeeById);

export default employeeRouter;
