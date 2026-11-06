import { api } from "../../../lib/api";

const mapStoreAdmin = (user) => ({
    ...user,
    id: user._id,
    requestedRole: "Store Administrator",
    registrationDate: user.createdAt,
    status: user.approvalStatus || (user.isApproved ? "verified" : "pending"),
    documents: [],
});

export const userVerificationService = {
    async getUsers(tab = "all") {
        const response = await api.get("/admin/users");
        const users = response.data?.data?.users;
        if (!Array.isArray(users)) {
            throw new Error("User verification response was invalid");
        }
        return users
            .filter((user) => user.role === "storeadmin")
            .map(mapStoreAdmin)
            .filter((user) => tab === "all" || user.status === tab);
    },

    async verifyUser(userId) {
        const response = await api.patch(`/auth/store-admin/${userId}/approve`);
        return mapStoreAdmin(response.data?.data?.user);
    },

    async rejectUser(userId, reason) {
        const response = await api.patch(`/auth/store-admin/${userId}/reject`, { reason });
        return mapStoreAdmin(response.data?.data?.user);
    },
};
