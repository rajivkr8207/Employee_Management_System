import { Router } from 'express';
import { verifyAdmin, verifyJWT } from '../../middlewares/auth.middleware.js';
import {
  getDashboardStats,
  getEmployees,
  getStores,
  getUsers,
} from './admin.controller.js';

const adminRouter = Router();

adminRouter.use(verifyJWT, verifyAdmin);
adminRouter.get('/dashboard/stats', getDashboardStats);
adminRouter.get('/users', getUsers);
adminRouter.get('/stores', getStores);
adminRouter.get('/employees', getEmployees);

export default adminRouter;