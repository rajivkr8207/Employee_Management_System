import { Router } from 'express';
import { verifyAdmin, verifyJWT } from '../../middlewares/auth.middleware.js';
import {
  createOrganizationForOwner,
  getMyOrganization,
  getPendingOrganizations,
  reviewOrganization,
} from './organization.controller.js';
import {
  createOrganizationValidation,
  reviewOrganizationValidation,
} from './organization.validate.js';

const organizationRouter = Router();

organizationRouter.use(verifyJWT);
organizationRouter.post('/', createOrganizationValidation, createOrganizationForOwner);
organizationRouter.get('/mine', getMyOrganization);
organizationRouter.get('/pending', verifyAdmin, getPendingOrganizations);
organizationRouter.patch(
  '/:organizationId/approval',
  verifyAdmin,
  reviewOrganizationValidation,
  reviewOrganization,
);

export default organizationRouter;
