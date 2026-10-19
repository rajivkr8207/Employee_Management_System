import express from 'express';
import healthRoute from './modules/health/health.route.js';
import authRouter from './modules/user/user.route.js';

const AllRoutes = express.Router();

AllRoutes.use('/health', healthRoute);
AllRoutes.use('/auth', authRouter);

export { AllRoutes };
