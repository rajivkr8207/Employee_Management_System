import { api } from "../../../lib/api";

const STORAGE_KEY = "ems_mock_manager_verifications";

const INITIAL_MOCK_MANAGERS = [
    {
        id: "mgr_301",
        fullName: "Ananya Sharma",
        email: "ananya.sharma@nexusretail.in",
        phone: "9876543210",
        avatar: null,
        assignedStore: {
            id: "str_201",
            name: "Nexus Superstore - Bandra",
            code: "STR-MUM-01",
            city: "Mumbai",
            approvalStatus: "pending", // Notice: store is PENDING!
        },
        experience: "4.5 Years in Retail Store Operations (formerly at Reliance Retail)",
        documents: [
            { type: "ID Proof (Govt)", name: "pan_ananya.pdf", verified: true },
            { type: "Prior Experience Letter", name: "relieving_letter.pdf", verified: true },
            { type: "Educational Certificate", name: "mba_retail_mgmt.pdf", verified: true },
        ],
        registrationDate: "2026-10-28T14:15:00Z",
        status: "pending", // pending | approved | rejected | suspended
        rejectionReason: null,
        notes: null,
    },
    {
        id: "mgr_302",
        fullName: "Rajesh Kulkarni",
        email: "rajesh.k@quickmart.com",
        phone: "9845012345",
        avatar: null,
        assignedStore: {
            id: "str_202",
            name: "QuickMart Express - Indiranagar",
            code: "STR-BLR-02",
            city: "Bengaluru",
            approvalStatus: "approved", // Store is APPROVED!
        },
        experience: "6 Years as Floor & Shift Manager at More Supermarket",
        documents: [
            { type: "Aadhaar Card", name: "aadhaar_rajesh.pdf", verified: true },
            { type: "Appointment Letter", name: "appointment_letter.pdf", verified: true },
        ],
        registrationDate: "2026-10-19T10:00:00Z",
        status: "approved",
        rejectionReason: null,
        notes: "Assigned store is verified and active.",
        approvedAt: "2026-10-21T11:30:00Z",
    },
    {
        id: "mgr_303",
        fullName: "Siddharth Nair",
        email: "siddharth.n@hypermarket.in",
        phone: "9711002233",
        avatar: null,
        assignedStore: {
            id: "str_203",
            name: "Apex Hypermarket - CyberCity",
            code: "STR-GGN-03",
            city: "Gurugram",
            approvalStatus: "pending",
        },
        experience: "3 Years in Inventory & Logistics Supervision",
        documents: [
            { type: "Passport Copy", name: "passport_sid.pdf", verified: true },
            { type: "Salary Slips (Previous)", name: "pay_slips_q3.pdf", verified: false },
        ],
        registrationDate: "2026-10-29T11:45:00Z",
        status: "pending",
        rejectionReason: null,
        notes: null,
    },
    {
        id: "mgr_304",
        fullName: "Karan Verma",
        email: "karan.verma@apexmart.com",
        phone: "9988776655",
        avatar: null,
        assignedStore: {
            id: "str_204",
            name: "Metro Retail - Connaught Place",
            code: "STR-DEL-04",
            city: "New Delhi",
            approvalStatus: "rejected",
        },
        experience: "1 Year at local grocery store",
        documents: [
            { type: "ID Proof", name: "id_karan_blur.jpg", verified: false },
        ],
        registrationDate: "2026-10-20T16:45:00Z",
        status: "rejected",
        rejectionReason: "Incomplete identity documents and unapproved assigned store.",
        notes: null,
        rejectedAt: "2026-10-22T09:15:00Z",
    },
];

function getStoredMockManagers() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return JSON.parse(data);
    } catch {
        // fallback
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_MANAGERS));
    return INITIAL_MOCK_MANAGERS;
}

function saveMockManagers(managers) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(managers));
    } catch {
        // ignore
    }
}

export const managerVerificationService = {
    async getManagers(tab = "all") {
        try {
            const res = await api.get(`/admin/manager-verifications?status=${tab}`);
            if (res.data?.data) return res.data.data;
        } catch {
            // fallback
        }

        const all = getStoredMockManagers();
        if (tab === "all") return all;
        return all.filter((m) => m.status === tab);
    },

    async approveManager(managerId) {
        try {
            const res = await api.patch(`/admin/manager-verifications/${managerId}/approve`);
            if (res.data?.data) return res.data.data;
        } catch {
            // fallback
        }

        const managers = getStoredMockManagers();
        const updated = managers.map((m) =>
            m.id === managerId
                ? { ...m, status: "approved", rejectionReason: null, approvedAt: new Date().toISOString() }
                : m
        );
        saveMockManagers(updated);
        return updated.find((m) => m.id === managerId);
    },

    async rejectManager(managerId, rejectionReason) {
        try {
            const res = await api.patch(`/admin/manager-verifications/${managerId}/reject`, { rejectionReason });
            if (res.data?.data) return res.data.data;
        } catch {
            // fallback
        }

        const managers = getStoredMockManagers();
        const updated = managers.map((m) =>
            m.id === managerId
                ? { ...m, status: "rejected", rejectionReason, rejectedAt: new Date().toISOString() }
                : m
        );
        saveMockManagers(updated);
        return updated.find((m) => m.id === managerId);
    },

    async requestAdditionalInfo(managerId, notes) {
        try {
            const res = await api.post(`/admin/manager-verifications/${managerId}/request-info`, { notes });
            if (res.data?.data) return res.data.data;
        } catch {
            // fallback
        }

        const managers = getStoredMockManagers();
        const updated = managers.map((m) =>
            m.id === managerId
                ? { ...m, notes, infoRequestedAt: new Date().toISOString() }
                : m
        );
        saveMockManagers(updated);
        return updated.find((m) => m.id === managerId);
    },
};

