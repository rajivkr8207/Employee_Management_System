import { body, param, query } from 'express-validator';
import { validate } from '../../config/validate.js';

const leaveStatuses = ['pending', 'approved', 'rejected'];
const validDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const leaveIdValidation = param('leaveId').isMongoId().withMessage('A valid leave ID is required');
const organizationQueryValidation = query('organizationId')
  .isMongoId()
  .withMessage('A valid organization ID is required');

export const createLeaveValidation = [
  body()
    .custom(
      (value) =>
        isObject(value) &&
        Object.keys(value).every((field) =>
          ['organizationId', 'from', 'to', 'reason'].includes(field),
        ),
    )
    .withMessage('Only organizationId, from, to, and reason can be provided'),
  body('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  body('from').custom(validDate).withMessage('from must be a valid date in YYYY-MM-DD format'),
  body('to')
    .custom(validDate)
    .withMessage('to must be a valid date in YYYY-MM-DD format')
    .custom((to, { req }) => !validDate(req.body.from) || to >= req.body.from)
    .withMessage('Leave end date must be on or after start date'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Leave reason is required')
    .isLength({ max: 1000 })
    .withMessage('Leave reason cannot exceed 1000 characters'),
  validate,
];

const leaveListFilters = [
  organizationQueryValidation,
  query('storeId').optional().isMongoId().withMessage('A valid store ID is required'),
  query('employeeId').optional().isMongoId().withMessage('A valid employee ID is required'),
  query('status')
    .optional()
    .isIn(leaveStatuses)
    .withMessage('Status must be pending, approved, or rejected'),
  query('from')
    .optional()
    .custom(validDate)
    .withMessage('from must be a valid date in YYYY-MM-DD format'),
  query('to')
    .optional()
    .custom(validDate)
    .withMessage('to must be a valid date in YYYY-MM-DD format'),
  query()
    .custom((value) => !value.from || !value.to || value.from <= value.to)
    .withMessage('from cannot be later than to'),
];

export const listLeavesValidation = [...leaveListFilters, validate];

export const myLeavesValidation = [
  organizationQueryValidation,
  query('status')
    .optional()
    .isIn(leaveStatuses)
    .withMessage('Status must be pending, approved, or rejected'),
  query('from')
    .optional()
    .custom(validDate)
    .withMessage('from must be a valid date in YYYY-MM-DD format'),
  query('to')
    .optional()
    .custom(validDate)
    .withMessage('to must be a valid date in YYYY-MM-DD format'),
  query()
    .custom((value) => !value.from || !value.to || value.from <= value.to)
    .withMessage('from cannot be later than to'),
  validate,
];

export const getLeaveValidation = [leaveIdValidation, organizationQueryValidation, validate];

export const reviewLeaveValidation = [
  leaveIdValidation,
  organizationQueryValidation,
  body()
    .custom(
      (value) =>
        isObject(value) && Object.keys(value).length === 1 && Object.keys(value).includes('status'),
    )
    .withMessage('Only a review status can be provided'),
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Review status must be approved or rejected'),
  validate,
];
