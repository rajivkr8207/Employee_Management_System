import { api } from "../../../lib/api";

export const leaveService = {
  getMine: (params) => api.get("/leaves/mine", { params }),
  getLeaves: (params) => api.get("/leaves", { params }),
  apply: (data) => api.post("/leaves", data),
  review: (leaveId, organizationId, status) =>
    api.patch(`/leaves/${leaveId}/review`, { status }, { params: { organizationId } }),
  cancel: (leaveId, organizationId) =>
    api.delete(`/leaves/${leaveId}`, { params: { organizationId } }),
};
