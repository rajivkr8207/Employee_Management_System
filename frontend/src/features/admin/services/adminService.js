import { api } from "../../../lib/api";

export const adminService = {
    getAdminDashboardStats: () => api.get("/admin/dashboard/stats"),
    getUsers: () => api.get("/admin/users"),
    getStores: () => api.get("/admin/stores"),
    getEmployees: () => api.get("/admin/employees"),
    getActivityLogs: (params) => api.get("/admin/activity-logs", { params }),
};
