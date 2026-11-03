import { api } from "../../../lib/api";

export const organizationService = {
  getMyOrganization: () => api.get("/organizations/mine"),
  createOrganization: (data) => api.post("/organizations", data),
  updateMyOrganization: (data) => api.patch("/organizations/mine", data),
  getPendingOrganizations: () => api.get("/organizations/pending"),
  reviewOrganization: (organizationId, verificationStatus) =>
    api.patch(`/organizations/${organizationId}/approval`, { verificationStatus }),
};
