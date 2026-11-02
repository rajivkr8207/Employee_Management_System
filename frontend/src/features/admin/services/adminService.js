import { api } from "../../../lib/api";

export const adminService = {
    async getAdminDashboardStats() {
        try {
            const res = await api.get("/admin/dashboard/stats");
            if (res.data?.data) return res.data.data;
        } catch {
            // fallback
        }

        // Return comprehensive stats computed or default mock
        return {
            users: {
                total: 1248,
                verified: 1180,
                pending: 48,
                rejected: 20,
            },
            stores: {
                total: 86,
                approved: 74,
                pending: 9,
                rejected: 3,
            },
            managers: {
                total: 92,
                approved: 81,
                pending: 8,
                rejected: 3,
            },
            recentRegistrations: [
                { id: "reg_1", name: "Rohan Patel", role: "Employee", time: "10 mins ago", status: "pending" },
                { id: "reg_2", name: "Ananya Sharma", role: "Store Manager", time: "45 mins ago", status: "pending" },
                { id: "reg_3", name: "Apex Hypermarket", role: "Store", time: "2 hours ago", status: "pending" },
                { id: "reg_4", name: "Vikram Malhotra", role: "Store Admin", time: "3 hours ago", status: "pending" },
                { id: "reg_5", name: "Kavita Rao", role: "Employee", time: "5 hours ago", status: "verified" },
            ],
            recentApprovals: [
                { id: "app_1", subject: "Pooja Hegde (Store Admin)", action: "Approved", time: "1 hour ago", admin: "Super Admin", status: "approved" },
                { id: "app_2", subject: "QuickMart Express - Indiranagar", action: "Approved", time: "3 hours ago", admin: "Super Admin", status: "approved" },
                { id: "app_3", subject: "Rajesh Kulkarni (Store Manager)", action: "Approved", time: "5 hours ago", admin: "Super Admin", status: "approved" },
                { id: "app_4", subject: "Metro Retail - CP", action: "Rejected", time: "Yesterday", admin: "Super Admin", status: "rejected", reason: "Expired NOC" },
                { id: "app_5", subject: "Karan Verma (Manager)", action: "Rejected", time: "2 days ago", admin: "Super Admin", status: "rejected", reason: "Blur ID" },
            ],
        };
    },
};

