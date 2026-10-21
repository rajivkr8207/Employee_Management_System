import { body, param } from 'express-validator';
import { validate } from '../../config/validate.js';

const allowedOrganizationFields = ['name', 'email', 'phone', 'businessType', 'address'];
const allowedAddressFields = ['street', 'city', 'state', 'pincode', 'country'];

const isObjectWithAllowedKeys = (value, allowedKeys) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).every((key) => allowedKeys.includes(key));

export const createOrganizationValidation = [
  body()
    .custom(
      (value) =>
        isObjectWithAllowedKeys(value, allowedOrganizationFields) && Object.keys(value).length > 0,
    )
    .withMessage('Only organization details can be provided'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Organization name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Organization name must be between 2 and 120 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid organization email is required')
    .toLowerCase(),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone number cannot exceed 30 characters'),
  body('businessType')
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage('Business type cannot exceed 80 characters'),
  body('address')
    .optional()
    .custom((value) => isObjectWithAllowedKeys(value, allowedAddressFields))
    .withMessage('Address must contain valid address fields'),
  body('address.street').optional().isString().trim(),
  body('address.city').optional().isString().trim(),
  body('address.state').optional().isString().trim(),
  body('address.pincode').optional().isString().trim(),
  body('address.country').optional().isString().trim(),
  validate,
];

export const reviewOrganizationValidation = [
  param('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  body()
    .custom((value) => isObjectWithAllowedKeys(value, ['verificationStatus']))
    .withMessage('Only the approval decision can be provided'),
  body('verificationStatus')
    .isIn(['approved', 'rejected'])
    .withMessage('Verification status must be approved or rejected'),
  validate,
];
