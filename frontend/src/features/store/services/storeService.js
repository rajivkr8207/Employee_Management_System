import { api } from "../../../lib/api";

export const storeService = {
  getMyStores: () => api.get("/stores"),
  createStore: (data) => api.post("/stores", data),
  updateStore: (storeId, data) => api.patch(`/stores/${storeId}`, data),
  deleteStore: (storeId) => api.delete(`/stores/${storeId}`),
  getStoreManagers: (storeId) => api.get(`/stores/${storeId}/managers`),
  createStoreManager: (storeId, data) => api.post(`/stores/${storeId}/managers`, data),
  updateStoreManager: (storeId, managerId, isActive) =>
    api.patch(`/stores/${storeId}/managers/${managerId}`, { isActive }),
  deleteStoreManager: (storeId, managerId) =>
    api.delete(`/stores/${storeId}/managers/${managerId}`),
};
