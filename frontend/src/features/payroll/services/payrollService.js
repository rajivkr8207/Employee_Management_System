import { api } from "../../../lib/api";

export const payrollService = {
  getPayrolls: (params) => api.get("/payroll", { params }),
  generatePayrun: (data) => api.post("/payroll/payrun", data),
  getPayrollById: (id) => api.get(`/payroll/${id}`),
  updatePayrollStatus: (id, data) => api.patch(`/payroll/${id}/status`, data),
  getMySalary: () => api.get("/payroll/me"),
};

