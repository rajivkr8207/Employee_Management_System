import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import {
  addDepartment,
  getDepartments,
  getDepartmentById,
  modifyDepartment,
  removeDepartment,
  addDesignation,
  getDesignations,
  modifyDesignation,
  removeDesignation,
} from './department.controller.js';
import {
  createDepartmentValidation,
  listDepartmentsValidation,
  createDesignationValidation,
  listDesignationsValidation,
} from './department.validate.js';

const departmentRouter = Router();

departmentRouter.use(verifyJWT);

departmentRouter
  .route('/')
  .post(createDepartmentValidation, addDepartment)
  .get(listDepartmentsValidation, getDepartments);

departmentRouter
  .route('/designations')
  .post(createDesignationValidation, addDesignation)
  .get(listDesignationsValidation, getDesignations);

departmentRouter.route('/designations/:id').patch(modifyDesignation).delete(removeDesignation);

departmentRouter
  .route('/:id')
  .get(getDepartmentById)
  .patch(modifyDepartment)
  .delete(removeDepartment);

export default departmentRouter;
