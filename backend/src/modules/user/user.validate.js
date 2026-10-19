import { body, param, query } from 'express-validator';
import { validate } from '../../config/validate.js';

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
export const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Full name must be between 2 and 60 characters'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .isAlphanumeric()
    .withMessage('Username can only contain letters and numbers')
    .toLowerCase(),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .toLowerCase(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('mobile')
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid mobile number'),
  validate,
];

export const verifyOtpValidation = [
  body()
    .custom((_, { req }) => {
      const email = req.body.email || req.query.email;
      return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    })
    .withMessage('A valid email is required'),
  body('otp')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('OTP must be a 6-digit code'),
  validate,
];

export const resendOtpValidation = [
  body()
    .custom((_, { req }) => {
      const email = req.body.email || req.query.email;
      return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    })
    .withMessage('A valid email is required'),
  validate,
];

export const storeAdminInvitationValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').toLowerCase(),
  validate,
];

export const storeAdminApprovalValidation = [
  param('userId').isMongoId().withMessage('A valid user ID is required'),
  validate,
];

export const invitedStoreAdminRegisterValidation = [
  body('token')
    .trim()
    .matches(/^[a-f0-9]{64}$/i)
    .withMessage('A valid invitation token is required'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Full name must be between 2 and 60 characters'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .isAlphanumeric()
    .withMessage('Username can only contain letters and numbers')
    .toLowerCase(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('mobile')
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid mobile number'),
  validate,
];

export const verifyStoreAdminInvitationValidation = [
  query('token')
    .trim()
    .matches(/^[a-f0-9]{64}$/i)
    .withMessage('A valid invitation token is required'),
  validate,
];

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export const loginValidation = [
  body('identifier').trim().notEmpty().withMessage('Email, username, or mobile is required'),

  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ─────────────────────────────────────────────
// EDIT PROFILE
// ─────────────────────────────────────────────
export const editProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Full name must be between 2 and 60 characters'),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .isAlphanumeric()
    .withMessage('Username can only contain letters and numbers')
    .toLowerCase(),
  validate,
];

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────
export const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/\d/)
    .withMessage('New password must contain at least one number'),
  validate,
];
