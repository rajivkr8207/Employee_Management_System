import { api } from "../../../lib/api";

export const shiftService = {
  getShifts: (params) => api.get("/shifts", { params }),
  createShift: (data) => api.post("/shifts", data),
  getAssignments: (params) => api.get("/shifts/assignments", { params }),
  createAssignment: (data) => api.post("/shifts/assignments", data),
  deleteAssignment: (assignmentId, organizationId) =>
    api.delete(`/shifts/assignments/${assignmentId}`, { params: { organizationId } }),
};
