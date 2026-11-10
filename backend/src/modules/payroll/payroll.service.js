import { ApiError } from '../../utils/ApiError.js';
import { PayrollModel } from './payroll.model.js';
import { EmployeeModel } from '../employee/employee.model.js';
import { AttendanceModel } from '../attendence/attendence.model.js';
import { authorizeOrganizationAccess } from '../membership/membership.service.js';

export const generatePayrun = async ({ organizationId, storeId, month, year }, userId) => {
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
    allowedRoles: ['owner', 'store_admin', 'manager'],
  });

  const m = Number(month);
  const y = Number(year);
  if (!m || m < 1 || m > 12 || !y) {
    throw new ApiError(400, 'Valid month (1-12) and year are required');
  }

  const query = { organizationId, status: 'active' };
  if (storeId) query.storeId = storeId;
  const employees = await EmployeeModel.find(query);

  if (!employees.length) {
    throw new ApiError(404, 'No active employees found to generate payroll for');
  }

  const totalDays = new Date(y, m, 0).getDate();
  const startDate = new Date(Date.UTC(y, m - 1, 1));
  const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));

  const generated = [];

  for (const emp of employees) {
    const presentRecords = await AttendanceModel.countDocuments({
      employeeId: emp._id,
      status: { $in: ['present', 'half-day'] },
      date: { $gte: startDate, $lte: endDate },
    });

    const baseSalary = emp.salary || 0;
    // Calculate per-day rate based on month's days
    const dailyRate = baseSalary / totalDays;
    const allowances = 0;
    // If attendance is tracked, absent days are deducted; if no attendance entries yet in draft, baseSalary applies
    const absentDays = Math.max(0, totalDays - presentRecords);
    const deductions = presentRecords > 0 ? Math.round(absentDays * dailyRate) : 0;
    const netSalary = Math.max(0, Math.round(baseSalary + allowances - deductions));

    const payroll = await PayrollModel.findOneAndUpdate(
      {
        employeeId: emp._id,
        payPeriodMonth: m,
        payPeriodYear: y,
      },
      {
        $set: {
          organizationId: emp.organizationId,
          storeId: emp.storeId,
          baseSalary,
          allowances,
          deductions,
          netSalary,
          presentDays: presentRecords,
          totalDays,
          status: 'draft',
        },
      },
      { upsert: true, new: true },
    );
    generated.push(payroll);
  }

  return generated;
};

export const listPayrolls = async (
  { organizationId, storeId, month, year, employeeId, page = 1, limit = 50 },
  userId,
) => {
  await authorizeOrganizationAccess({
    userId,
    organizationId,
    storeId,
  });

  const filter = { organizationId };
  if (storeId) filter.storeId = storeId;
  if (month) filter.payPeriodMonth = Number(month);
  if (year) filter.payPeriodYear = Number(year);
  if (employeeId) filter.employeeId = employeeId;

  const skip = (Number(page) - 1) * Number(limit);
  const [payrolls, total] = await Promise.all([
    PayrollModel.find(filter)
      .populate({
        path: 'employeeId',
        select: 'employeeCode designation salary userId storeId',
        populate: { path: 'userId', select: 'fullName username email' },
      })
      .populate('storeId', 'name code')
      .sort({ payPeriodYear: -1, payPeriodMonth: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PayrollModel.countDocuments(filter),
  ]);

  return { payrolls, total, page: Number(page), limit: Number(limit) };
};

export const getPayrollById = async (payrollId, userId) => {
  const payroll = await PayrollModel.findById(payrollId)
    .populate({
      path: 'employeeId',
      select: 'employeeCode designation salary userId storeId',
      populate: { path: 'userId', select: 'fullName username email mobile' },
    })
    .populate('storeId', 'name code address');
  if (!payroll) throw new ApiError(404, 'Payroll record not found');

  await authorizeOrganizationAccess({
    userId,
    organizationId: payroll.organizationId,
    storeId: payroll.storeId,
  });

  return payroll;
};

export const updatePayrollStatus = async (payrollId, { status, paymentDate, notes }, userId) => {
  const payroll = await PayrollModel.findById(payrollId);
  if (!payroll) throw new ApiError(404, 'Payroll record not found');

  await authorizeOrganizationAccess({
    userId,
    organizationId: payroll.organizationId,
    storeId: payroll.storeId,
    allowedRoles: ['owner', 'store_admin'],
  });

  if (status) payroll.status = status;
  if (paymentDate !== undefined)
    payroll.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
  if (notes !== undefined) payroll.notes = notes;

  await payroll.save();
  return payroll;
};

export const getMyPayrolls = async (userId) => {
  const emp = await EmployeeModel.findOne({ userId });
  if (!emp) throw new ApiError(404, 'Employee profile not found');

  return PayrollModel.find({ employeeId: emp._id })
    .populate('storeId', 'name code')
    .sort({ payPeriodYear: -1, payPeriodMonth: -1 });
};
