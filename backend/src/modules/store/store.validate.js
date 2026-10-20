import { body, param } from 'express-validator';
import { validate } from '../../config/validate.js';

const allowedStoreFields = ['name', 'code', 'address', 'location', 'managerId', 'status'];
const allowedCreateFields = ['name', 'code', 'address', 'location', 'status'];
const allowedAddressFields = ['street', 'city', 'state', 'pincode', 'country'];
const allowedLocationFields = ['lat', 'lng', 'radius'];

const isObjectWithAllowedKeys = (value, allowedKeys) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0 &&
  Object.keys(value).every((key) => allowedKeys.includes(key));

const storeIdValidation = param('storeId').isMongoId().withMessage('A valid store ID is required');

const storeFieldsValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ max: 120 })
    .withMessage('Store name cannot exceed 120 characters'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Store code is required')
    .isLength({ max: 50 })
    .withMessage('Store code cannot exceed 50 characters'),
  body('address')
    .optional()
    .custom((value) => isObjectWithAllowedKeys(value, allowedAddressFields))
    .withMessage('Address must be an object'),
  body('address.street').optional().isString().trim(),
  body('address.city').optional().isString().trim(),
  body('address.state').optional().isString().trim(),
  body('address.pincode').optional().isString().trim(),
  body('address.country').optional().isString().trim(),
  body('location')
    .custom((value) => isObjectWithAllowedKeys(value, allowedLocationFields))
    .withMessage('Location is required and must be an object'),
  body('location.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90')
    .toFloat(),
  body('location.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
    .toFloat(),
  body('location.radius')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Location radius must be greater than zero')
    .toFloat(),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
];

export const createStoreValidation = [
  body()
    .custom(
      (value) =>
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).every((field) => allowedCreateFields.includes(field)),
    )
    .withMessage('Only store details can be provided when creating a store'),
  ...storeFieldsValidation,
  validate,
];

export const updateStoreValidation = [
  storeIdValidation,
  body()
    .custom(
      (value) =>
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).length > 0 &&
        Object.keys(value).every((field) => allowedStoreFields.includes(field)),
    )
    .withMessage('At least one valid store field must be provided'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Store name cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Store name cannot exceed 120 characters'),
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Store code cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Store code cannot exceed 50 characters'),
  body('address')
    .optional()
    .custom((value) => isObjectWithAllowedKeys(value, allowedAddressFields))
    .withMessage('Address must be an object'),
  body('address.street').optional().isString().trim(),
  body('address.city').optional().isString().trim(),
  body('address.state').optional().isString().trim(),
  body('address.pincode').optional().isString().trim(),
  body('address.country').optional().isString().trim(),
  body('location')
    .optional()
    .custom((value) => isObjectWithAllowedKeys(value, allowedLocationFields))
    .withMessage('Location must be an object'),
  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90')
    .toFloat(),
  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
    .toFloat(),
  body('location.radius')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Location radius must be greater than zero')
    .toFloat(),
  body('managerId')
    .optional({ nullable: true })
    .custom((value) => value === null || /^[a-f\d]{24}$/i.test(value))
    .withMessage('Manager ID must be a valid user ID or null'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  validate,
];

export const storeIdParamValidation = [storeIdValidation, validate];
