import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import { getMemberships } from './membership.controller.js';
import { listMembershipsValidation } from './membership.validate.js';

const membershipRouter = Router();

membershipRouter.use(verifyJWT);
membershipRouter.get('/', listMembershipsValidation, getMemberships);

export default membershipRouter;
