import { body, query, param } from 'express-validator';
import { validate } from '../../config/validate.js';

export const generatePayrunValidation = [
  body('organizationId').isMongoId().withMessage('Valid organizationId is required'),
  body('storeId').optional().isMongoId().withMessage('Valid storeId is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2020 }).withMessage('Year must be valid'),
  validate,
];

export const listPayrollsValidation = [
  query('organizationId').isMongoId().withMessage('Valid organizationId is required'),
  query('storeId').optional().isMongoId(),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 }),
  validate,
];

export const updatePayrollStatusValidation = [
  param('id').isMongoId().withMessage('Valid payroll ID is required'),
  body('status').optional().isIn(['draft', 'approved', 'paid']),
  validate,
];
