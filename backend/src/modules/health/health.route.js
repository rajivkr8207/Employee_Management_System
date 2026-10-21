import express from 'express';
import { healthCheck } from './health.controller.js';

const healthRoute = express.Router();

healthRoute.get('/', healthCheck);

export default healthRoute;
