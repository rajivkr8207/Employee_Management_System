import { api } from "../../../lib/api";

export const departmentService = {
  getDepartments: (params) => api.get("/departments", { params }),
  createDepartment: (data) => api.post("/departments", data),
  updateDepartment: (id, data) => api.patch(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),

  getDesignations: (params) => api.get("/departments/designations", { params }),
  createDesignation: (data) => api.post("/departments/designations", data),
  updateDesignation: (id, data) => api.patch(`/departments/designations/${id}`, data),
  deleteDesignation: (id) => api.delete(`/departments/designations/${id}`),
};

