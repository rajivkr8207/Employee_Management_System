import express from 'express';
import healthRoute from './modules/health/health.route.js';
import employeeRouter from './modules/employee/employee.route.js';
import membershipRouter from './modules/membership/membership.route.js';
import organizationRouter from './modules/organization/organization.route.js';
import storeRouter from './modules/store/store.route.js';
import authRouter from './modules/user/user.route.js';

const AllRoutes = express.Router();

AllRoutes.use('/health', healthRoute);
AllRoutes.use('/organizations', organizationRouter);
AllRoutes.use('/stores', storeRouter);
AllRoutes.use('/employees', employeeRouter);
AllRoutes.use('/memberships', membershipRouter);
AllRoutes.use('/auth', authRouter);

export { AllRoutes };
