import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  generatePayrun,
  listPayrolls,
  getPayrollById,
  updatePayrollStatus,
  getMyPayrolls,
} from './payroll.service.js';

export const createPayrun = asyncHandler(async (req, res) => {
  const payrolls = await generatePayrun(req.body, req.user.id);
  return res.status(201).json(new ApiResponse(201, { payrolls }, 'Payrun generated successfully'));
});

export const getPayrolls = asyncHandler(async (req, res) => {
  const result = await listPayrolls(
    {
      organizationId: req.query.organizationId,
      storeId: req.query.storeId,
      month: req.query.month,
      year: req.query.year,
      employeeId: req.query.employeeId,
      page: req.query.page,
      limit: req.query.limit,
    },
    req.user.id,
  );
  return res.status(200).json(new ApiResponse(200, result, 'Payrolls fetched successfully'));
});

export const getPayroll = asyncHandler(async (req, res) => {
  const payroll = await getPayrollById(req.params.id, req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { payroll }, 'Payroll details fetched successfully'));
});

export const modifyPayrollStatus = asyncHandler(async (req, res) => {
  const payroll = await updatePayrollStatus(req.params.id, req.body, req.user.id);
  return res.status(200).json(new ApiResponse(200, { payroll }, 'Payroll updated successfully'));
});

export const getMySalary = asyncHandler(async (req, res) => {
  const payrolls = await getMyPayrolls(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { payrolls }, 'Salary records fetched successfully'));
});
