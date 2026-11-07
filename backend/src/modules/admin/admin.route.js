import { Router } from 'express';
import { body, param, query } from 'express-validator';
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
  getManagerVerifications,
  approveManager,
  rejectManager,
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
adminRouter.get(
  '/manager-verifications',
  query('status').optional().isIn(['all', 'pending', 'approved', 'rejected']),
  validate,
  getManagerVerifications,
);
adminRouter.patch(
  '/manager-verifications/:managerId/approve',
  param('managerId').isMongoId().withMessage('A valid manager ID is required'),
  validate,
  approveManager,
);
adminRouter.patch(
  '/manager-verifications/:managerId/reject',
  param('managerId').isMongoId().withMessage('A valid manager ID is required'),
  body('reason').trim().notEmpty().isLength({ max: 500 }).withMessage('A rejection reason is required'),
  validate,
  rejectManager,
);

export default adminRouter;