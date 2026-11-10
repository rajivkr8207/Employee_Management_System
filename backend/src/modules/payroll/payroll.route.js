import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import {
  createPayrun,
  getPayrolls,
  getPayroll,
  modifyPayrollStatus,
  getMySalary,
} from './payroll.controller.js';
import {
  generatePayrunValidation,
  listPayrollsValidation,
  updatePayrollStatusValidation,
} from './payroll.validate.js';

const payrollRouter = Router();

payrollRouter.use(verifyJWT);

payrollRouter.post('/payrun', generatePayrunValidation, createPayrun);
payrollRouter.get('/', listPayrollsValidation, getPayrolls);
payrollRouter.get('/me', getMySalary);
payrollRouter.get('/:id', getPayroll);
payrollRouter.patch('/:id/status', updatePayrollStatusValidation, modifyPayrollStatus);

export default payrollRouter;
