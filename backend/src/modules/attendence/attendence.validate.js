import { body, param, query } from 'express-validator';
import { validate } from '../../config/validate.js';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const allowedLocationFields = ['lat', 'lng'];
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
};
const validIsoTimestamp = (value) =>
  value === null || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value));
const allowedManualFields = [
  'organizationId',
  'employeeId',
  'date',
  'checkIn',
  'checkOut',
  'status',
  'correctionReason',
];
const allowedCorrectionFields = ['checkIn', 'checkOut', 'status', 'correctionReason'];

const validateDateQuery = [
  query('date').optional().custom(validDate).withMessage('Date must be in YYYY-MM-DD format'),
  query('fromDate')
    .optional()
    .custom(validDate)
    .withMessage('fromDate must be in YYYY-MM-DD format'),
  query('toDate').optional().custom(validDate).withMessage('toDate must be in YYYY-MM-DD format'),
  query()
    .custom((value) => {
      if (value.date && (value.fromDate || value.toDate)) return false;
      if (value.fromDate && value.toDate) return value.fromDate <= value.toDate;
      return true;
    })
    .withMessage('Use either date or a valid fromDate/toDate range'),
];

const locationValidation = (field) => [
  body(field)
    .optional()
    .custom(
      (value) =>
        isObject(value) &&
        Object.keys(value).length === 2 &&
        Object.keys(value).every((key) => allowedLocationFields.includes(key)),
    )
    .withMessage('Location must contain only latitude and longitude'),
  body(`${field}.lat`)
    .if(body(field).exists())
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90')
    .toFloat(),
  body(`${field}.lng`)
    .if(body(field).exists())
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
    .toFloat(),
];

const checkInBodyValidation = [
  body()
    .custom(
      (value) =>
        isObject(value) &&
        Object.keys(value).every((field) => ['organizationId', 'location'].includes(field)),
    )
    .withMessage('Only organizationId and location can be provided'),
  body('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  ...locationValidation('location'),
  validate,
];

const attendanceIdParamValidation = param('attendanceId')
  .isMongoId()
  .withMessage('A valid attendance ID is required');

export const checkInValidation = checkInBodyValidation;

export const myAttendanceValidation = [
  query('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  ...validateDateQuery,
  validate,
];

export const listAttendanceValidation = [
  query('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  query('storeId').optional().isMongoId().withMessage('A valid store ID is required'),
  query('employeeId').optional().isMongoId().withMessage('A valid employee ID is required'),
  ...validateDateQuery,
  validate,
];

export const attendanceIdValidation = [
  attendanceIdParamValidation,
  query('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  validate,
];

export const manualAttendanceValidation = [
  body()
    .custom(
      (value) =>
        isObject(value) && Object.keys(value).every((field) => allowedManualFields.includes(field)),
    )
    .withMessage('Only manual attendance fields can be provided'),
  body('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  body('employeeId').isMongoId().withMessage('A valid employee ID is required'),
  body('date').custom(validDate).withMessage('Date must be in YYYY-MM-DD format'),
  body('checkIn')
    .optional({ nullable: true })
    .custom(validIsoTimestamp)
    .withMessage('Check-in must be an ISO date-time or null')
    .bail()
    .if((value) => value !== null)
    .isISO8601()
    .withMessage('Check-in must be a valid date-time')
    .toDate(),
  body('checkOut')
    .optional({ nullable: true })
    .custom(validIsoTimestamp)
    .withMessage('Check-out must be an ISO date-time or null')
    .bail()
    .if((value) => value !== null)
    .isISO8601()
    .withMessage('Check-out must be a valid date-time')
    .toDate(),
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'half_day'])
    .withMessage('Attendance status must be present, absent, late, or half_day'),
  body('correctionReason')
    .trim()
    .notEmpty()
    .withMessage('A reason is required for manual attendance')
    .isLength({ max: 500 })
    .withMessage('Correction reason cannot exceed 500 characters'),
  validate,
];

export const updateAttendanceValidation = [
  attendanceIdParamValidation,
  query('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  body()
    .custom(
      (value) =>
        isObject(value) &&
        Object.keys(value).length > 0 &&
        Object.keys(value).every((field) => allowedCorrectionFields.includes(field)) &&
        typeof value.correctionReason === 'string',
    )
    .withMessage('Provide valid correction fields and a correctionReason'),
  body('checkIn')
    .optional({ nullable: true })
    .custom(validIsoTimestamp)
    .withMessage('Check-in must be an ISO date-time or null')
    .bail()
    .if((value) => value !== null)
    .isISO8601()
    .withMessage('Check-in must be a valid date-time')
    .toDate(),
  body('checkOut')
    .optional({ nullable: true })
    .custom(validIsoTimestamp)
    .withMessage('Check-out must be an ISO date-time or null')
    .bail()
    .if((value) => value !== null)
    .isISO8601()
    .withMessage('Check-out must be a valid date-time')
    .toDate(),
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'half_day'])
    .withMessage('Attendance status must be present, absent, late, or half_day'),
  body('correctionReason')
    .trim()
    .notEmpty()
    .withMessage('A reason is required for attendance corrections')
    .isLength({ max: 500 })
    .withMessage('Correction reason cannot exceed 500 characters'),
  validate,
];
