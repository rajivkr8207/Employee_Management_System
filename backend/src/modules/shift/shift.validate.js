import { body, param, query } from 'express-validator';
import { validate } from '../../config/validate.js';

const createFields = ['organizationId', 'storeId', 'name', 'startTime', 'endTime', 'status'];
const updateFields = ['name', 'startTime', 'endTime', 'status'];
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const organizationQueryValidation = query('organizationId')
  .isMongoId()
  .withMessage('A valid organization ID is required');
const storeQueryValidation = query('storeId')
  .optional()
  .isMongoId()
  .withMessage('A valid store ID is required');
const shiftIdValidation = param('shiftId').isMongoId().withMessage('A valid shift ID is required');

export const createShiftValidation = [
  body()
    .custom(
      (value) =>
        isObject(value) && Object.keys(value).every((field) => createFields.includes(field)),
    )
    .withMessage('Only shift details can be provided when creating a shift'),
  body('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  body('storeId').isMongoId().withMessage('A valid store ID is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Shift name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Shift name must be between 2 and 100 characters'),
  body('startTime').matches(timePattern).withMessage('Start time must be in 24-hour HH:MM format'),
  body('endTime')
    .matches(timePattern)
    .withMessage('End time must be in 24-hour HH:MM format')
    .custom((endTime, { req }) => endTime !== req.body.startTime)
    .withMessage('Shift start time and end time must be different'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Shift status must be active or inactive'),
  validate,
];

export const listShiftsValidation = [organizationQueryValidation, storeQueryValidation, validate];

export const getShiftValidation = [shiftIdValidation, organizationQueryValidation, validate];

export const updateShiftValidation = [
  shiftIdValidation,
  organizationQueryValidation,
  body()
    .custom(
      (value) =>
        isObject(value) &&
        Object.keys(value).length > 0 &&
        Object.keys(value).every((field) => updateFields.includes(field)),
    )
    .withMessage('At least one valid shift field must be provided'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Shift name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Shift name must be between 2 and 100 characters'),
  body('startTime')
    .optional()
    .matches(timePattern)
    .withMessage('Start time must be in 24-hour HH:MM format'),
  body('endTime')
    .optional()
    .matches(timePattern)
    .withMessage('End time must be in 24-hour HH:MM format')
    .custom((endTime, { req }) => !req.body.startTime || endTime !== req.body.startTime)
    .withMessage('Shift start time and end time must be different'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Shift status must be active or inactive'),
  validate,
];
