import { api } from "../../../lib/api";

const mapStore = (store) => ({
    ...store,
    id: store._id,
    status: store.verificationStatus,
    registrationDate: store.createdAt,
    email: store.createdBy?.email || "",
    contactNumber: store.createdBy?.mobile || "",
    owner: {
        id: store.createdBy?._id,
        name: store.createdBy?.fullName || store.createdBy?.username || "Unknown",
        email: store.createdBy?.email || "",
        mobile: store.createdBy?.mobile || "",
        role: "Store Admin",
    },
    documents: [],
});

export const storeVerificationService = {
    async getStores(tab = "all") {
        const response = await api.get("/admin/store-verifications");
        const stores = response.data?.data?.stores;
        if (!Array.isArray(stores)) {
            throw new Error("Store verification response was invalid");
        }
        return stores
            .map(mapStore)
            .filter((store) => tab === "all" || store.status === tab);
    },

    async approveStore(storeId) {
        const response = await api.patch(`/admin/store-verifications/${storeId}/approve`);
        return mapStore(response.data?.data?.store);
    },

    async rejectStore(storeId, reason) {
        const response = await api.patch(`/admin/store-verifications/${storeId}/reject`, { reason });
        return mapStore(response.data?.data?.store);
    },
};
