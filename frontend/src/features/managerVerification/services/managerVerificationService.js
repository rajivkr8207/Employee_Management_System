import { api } from "../../../lib/api";

const getManager = (response) => {
    const manager = response.data?.data?.manager;
    if (!manager?.id) throw new Error("Manager verification response was invalid");
    return manager;
};

export const managerVerificationService = {
    async getManagers(tab = "all") {
        const response = await api.get("/admin/manager-verifications", {
            params: { status: tab },
        });
        const managers = response.data?.data?.managers;
        if (!Array.isArray(managers)) throw new Error("Manager verification response was invalid");
        return managers;
    },
    async approveManager(managerId) {
        return getManager(await api.patch(`/admin/manager-verifications/${managerId}/approve`));
    },
    async rejectManager(managerId, reason) {
        return getManager(
            await api.patch(`/admin/manager-verifications/${managerId}/reject`, { reason }),
        );
    },
};
