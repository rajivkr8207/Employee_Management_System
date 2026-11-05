import { Router } from 'express';
import { body, param } from 'express-validator';
import { verifyAdmin, verifyJWT } from '../../middlewares/auth.middleware.js';
import { validate } from '../../config/validate.js';
import {
  approveStore,
  getDashboardStats,
  getEmployees,
  getStores,
  getStoreVerifications,
  getUsers,
  rejectStore,
} from './admin.controller.js';

const adminRouter = Router();

adminRouter.use(verifyJWT, verifyAdmin);
adminRouter.get('/dashboard/stats', getDashboardStats);
adminRouter.get('/users', getUsers);
adminRouter.get('/stores', getStores);
adminRouter.get('/store-verifications', getStoreVerifications);
adminRouter.patch(
  '/store-verifications/:storeId/approve',
  param('storeId').isMongoId().withMessage('A valid store ID is required'),
  validate,
  approveStore,
);
adminRouter.patch(
  '/store-verifications/:storeId/reject',
  param('storeId').isMongoId().withMessage('A valid store ID is required'),
  body('reason').trim().notEmpty().isLength({ max: 500 }).withMessage('A rejection reason is required'),
  validate,
  rejectStore,
);
adminRouter.get('/employees', getEmployees);

export default adminRouter;