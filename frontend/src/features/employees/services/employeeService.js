import { api } from "../../../lib/api";

export const employeeService = {
  getEmployees: (params) => api.get("/employees", { params }),
  createEmployee: (data) => api.post("/employees", data),
  updateEmployee: (id, data) => api.patch(`/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
  getEmployeeById: (id) => api.get(`/employees/${id}`),
  getMyEmployee: () => api.get("/employees/me"),
};
