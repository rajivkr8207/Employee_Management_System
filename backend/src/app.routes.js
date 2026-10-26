import express from 'express';
import healthRoute from './modules/health/health.route.js';
import employeeRouter from './modules/employee/employee.route.js';
import membershipRouter from './modules/membership/membership.route.js';
import organizationRouter from './modules/organization/organization.route.js';
import storeRouter from './modules/store/store.route.js';
import authRouter from './modules/user/user.route.js';
import shiftRouter from './modules/shift/shift.route.js';
import attendanceRouter from './modules/attendence/attendence.route.js';
import leaveRouter from './modules/leave/leave.route.js';

const AllRoutes = express.Router();

AllRoutes.use('/health', healthRoute);
AllRoutes.use('/organizations', organizationRouter);
AllRoutes.use('/stores', storeRouter);
AllRoutes.use('/employees', employeeRouter);
AllRoutes.use('/memberships', membershipRouter);
AllRoutes.use('/shifts', shiftRouter);
AllRoutes.use('/attendance', attendanceRouter);
AllRoutes.use('/leaves', leaveRouter);
AllRoutes.use('/auth', authRouter);

export { AllRoutes };
