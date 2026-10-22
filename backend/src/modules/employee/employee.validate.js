import { body, param, query } from 'express-validator';
import { validate } from '../../config/validate.js';

const employeeFields = [
  'organizationId',
  'storeId',
  'storeIds',
  'role',
  'membershipStatus',
  'userId',
  'user',
  'employeeCode',
  'designation',
  'salary',
  'joiningDate',
  'status',
];
const newUserFields = ['fullName', 'username', 'email', 'password', 'mobile'];
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const organizationQueryValidation = query('organizationId')
  .isMongoId()
  .withMessage('A valid organization ID is required');
const storeQueryValidation = query('storeId')
  .optional()
  .isMongoId()
  .withMessage('A valid store ID is required');

export const createEmployeeValidation = [
  body()
    .custom((value) => {
      if (
        !isObject(value) ||
        !Object.keys(value).every((field) => employeeFields.includes(field))
      ) {
        return false;
      }
      const hasUserId = typeof value.userId === 'string';
      const hasUser = isObject(value.user);
      return (
        hasUserId !== hasUser &&
        (!hasUser ||
          (Object.keys(value.user).every((field) => newUserFields.includes(field)) &&
            ['fullName', 'username', 'email', 'password'].every(
              (field) => typeof value.user[field] === 'string',
            )))
      );
    })
    .withMessage('Provide either userId or complete new user details and only employee fields'),
  body('organizationId').isMongoId().withMessage('A valid organization ID is required'),
  body('storeId').isMongoId().withMessage('A valid store ID is required'),
  body('storeIds').optional().isArray({ min: 1 }).withMessage('storeIds must be a non-empty array'),
  body('storeIds.*').optional().isMongoId().withMessage('Every store ID must be valid'),
  body('role')
    .isIn(['manager', 'employee'])
    .withMessage('Membership role must be manager or employee'),
  body('membershipStatus')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Membership status must be active, inactive, or suspended'),
  body('userId').optional().isMongoId().withMessage('A valid existing user ID is required'),
  body('user.fullName')
    .if(body('user').exists())
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('User full name must be between 2 and 120 characters'),
  body('user.username')
    .if(body('user').exists())
    .trim()
    .matches(/^[a-zA-Z0-9]{3,30}$/)
    .withMessage('Username must be 3-30 letters or numbers'),
  body('user.email')
    .if(body('user').exists())
    .trim()
    .isEmail()
    .withMessage('A valid user email is required'),
  body('user.password')
    .if(body('user').exists())
    .isLength({ min: 6 })
    .withMessage('User password must contain at least 6 characters'),
  body('user.mobile')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid mobile number'),
  body('employeeCode')
    .trim()
    .notEmpty()
    .withMessage('Employee code is required')
    .isLength({ max: 50 })
    .withMessage('Employee code cannot exceed 50 characters'),
  body('designation')
    .trim()
    .notEmpty()
    .withMessage('Designation is required')
    .isLength({ max: 100 })
    .withMessage('Designation cannot exceed 100 characters'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be zero or greater').toFloat(),
  body('joiningDate')
    .optional()
    .isISO8601()
    .withMessage('Joining date must be a valid date')
    .toDate(),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'terminated'])
    .withMessage('Employee status must be active, inactive, or terminated'),
  validate,
];

export const listEmployeesValidation = [
  organizationQueryValidation,
  storeQueryValidation,
  validate,
];

export const getEmployeeValidation = [
  param('employeeId').isMongoId().withMessage('A valid employee ID is required'),
  organizationQueryValidation,
  validate,
];
