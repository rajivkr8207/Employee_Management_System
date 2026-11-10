import { body, param, query } from 'express-validator';
import { validate } from '../../config/validate.js';

export const createDepartmentValidation = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('code').trim().notEmpty().withMessage('Department code is required'),
  body('organizationId').isMongoId().withMessage('Valid organizationId is required'),
  body('description').optional().trim(),
  validate,
];

export const listDepartmentsValidation = [
  query('organizationId').isMongoId().withMessage('Valid organizationId query is required'),
  validate,
];

export const createDesignationValidation = [
  body('title').trim().notEmpty().withMessage('Designation title is required'),
  body('departmentId').isMongoId().withMessage('Valid departmentId is required'),
  body('level').optional().isIn(['junior', 'mid', 'senior', 'lead', 'manager']),
  body('baseSalary').optional().isFloat({ min: 0 }).toFloat(),
  validate,
];

export const listDesignationsValidation = [
  query('organizationId').isMongoId().withMessage('Valid organizationId query is required'),
  query('departmentId').optional().isMongoId().withMessage('Valid departmentId query is required'),
  validate,
];
