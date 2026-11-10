import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    payPeriodMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    payPeriodYear: {
      type: Number,
      required: true,
      min: 2020,
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    presentDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft',
      index: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
);

payrollSchema.index({ employeeId: 1, payPeriodMonth: 1, payPeriodYear: 1 }, { unique: true });

export const PayrollModel = mongoose.model('Payroll', payrollSchema);
