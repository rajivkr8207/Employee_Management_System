import { query } from 'express-validator';
import { validate } from '../../config/validate.js';

export const listMembershipsValidation = [
  query('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  query('storeId').optional().isMongoId().withMessage('A valid store ID is required'),
  validate,
];
