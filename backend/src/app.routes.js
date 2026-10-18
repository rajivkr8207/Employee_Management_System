import express from 'express';
import healthRoute from './modules/health/health.route.js';

const AllRoutes = express.Router();

AllRoutes.use('/health', healthRoute);


export { AllRoutes };