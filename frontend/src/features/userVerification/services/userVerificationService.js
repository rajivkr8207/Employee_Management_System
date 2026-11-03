import { api } from "../../../lib/api";

const STORAGE_KEY = "ems_mock_user_verifications";

const INITIAL_MOCK_USERS = [
    {
        id: "usr_101",
        fullName: "Vikram Malhotra",
        username: "vikram_m",
        email: "vikram.malhotra@retailchain.com",
        mobile: "9820123456",
        role: "storeadmin",
        requestedRole: "Store Admin",
        registrationDate: "2026-10-25T10:30:00Z",
        status: "pending",
        rejectionReason: null,
        notes: null,
        documents: [
            { type: "Govt ID (Aadhaar)", name: "aadhaar_vikram.pdf", verified: true },
            { type: "PAN Card", name: "pan_vikram.pdf", verified: true },
            { type: "Business Proof", name: "franchise_deed.pdf", verified: false },
        ],
        avatar: null,
        address: "42, Bandra West, Mumbai, Maharashtra 400050",
    },
    {
        id: "usr_102",
        fullName: "Ananya Sharma",
        username: "ananya_s",
        email: "ananya.sharma@nexusretail.in",
        mobile: "9876543210",
        role: "manager",
        requestedRole: "Store Manager",
        registrationDate: "2026-10-28T14:15:00Z",
        status: "pending",
        rejectionReason: null,
        notes: null,
        documents: [
            { type: "Resume", name: "ananya_resume_2026.pdf", verified: true },
            { type: "Govt ID (PAN)", name: "pan_ananya.pdf", verified: true },
            { type: "Experience Letter", name: "relieving_letter.pdf", verified: true },
        ],
        avatar: null,
        address: "Flat 301, Indiranagar, Bengaluru, Karnataka 560038",
    },
    {
        id: "usr_103",
        fullName: "Rohan Patel",
        username: "rohan_p",
        email: "rohan.patel@quickmart.com",
        mobile: "9712345678",
        role: "employ",
        requestedRole: "Employee",
        registrationDate: "2026-10-29T09:00:00Z",
        status: "pending",
        rejectionReason: null,
        notes: null,
        documents: [
            { type: "Aadhaar Card", name: "aadhaar_rohan.pdf", verified: false },
            { type: "Bank Passbook", name: "bank_details.pdf", verified: false },
        ],
        avatar: null,
        address: "B-12, Satellite, Ahmedabad, Gujarat 380015",
    },
    {
        id: "usr_104",
        fullName: "Pooja Hegde",
        username: "pooja_h",
        email: "pooja.hegde@retailhub.com",
        mobile: "9845123456",
        role: "storeadmin",
        requestedRole: "Store Admin",
        registrationDate: "2026-10-18T11:20:00Z",
        status: "verified",
        rejectionReason: null,
        notes: "Approved after verifying business license deed.",
        documents: [
            { type: "Aadhaar Card", name: "aadhaar_pooja.pdf", verified: true },
            { type: "GST Certificate", name: "gst_certificate.pdf", verified: true },
        ],
        avatar: null,
        address: "7th Cross, Koramangala, Bengaluru, Karnataka 560034",
    },
    {
        id: "usr_105",
        fullName: "Karan Verma",
        username: "karan_v",
        email: "karan.verma@apexmart.com",
        mobile: "9988776655",
        role: "manager",
        requestedRole: "Store Manager",
        registrationDate: "2026-10-20T16:45:00Z",
        status: "rejected",
        rejectionReason: "ID proof details mismatch with Aadhaar records. Blur photo.",
        notes: null,
        documents: [
            { type: "ID Proof", name: "id_karan_blur.jpg", verified: false },
        ],
        avatar: null,
        address: "Sector 18, Noida, Uttar Pradesh 201301",
    },
];

function getStoredMockUsers() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return JSON.parse(data);
    } catch {
        // fallback
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_USERS));
    return INITIAL_MOCK_USERS;
}

function saveMockUsers(users) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch {
        // ignore
    }
}

export const userVerificationService = {
    /**
     * Fetch all user verification records
     */
    async getUsers(tab = "all") {
        let dbUsers = [];
        try {
            const res = await api.get("/auth/store-admin/pending");
            const rawUsers = res.data?.data?.users || res.data?.data || [];
            dbUsers = rawUsers.map((u) => ({
                id: u._id,
                fullName: u.fullName,
                username: u.username,
                email: u.email,
                mobile: u.mobile || "N/A",
                role: u.role,
                requestedRole: "Store Admin",
                registrationDate: u.createdAt || new Date().toISOString(),
                status: "pending",
                rejectionReason: null,
                notes: "Registered via Admin Invitation link",
                documents: [
                    { type: "Official Invitation", name: "Token Verified", verified: true },
                ],
                avatar: null,
                address: "Pending Store Setup",
            }));
        } catch {
            // ignore
        }

        const stored = getStoredMockUsers();
        const storedEmails = new Set(stored.map((u) => u.email.toLowerCase()));
        const uniqueDbUsers = dbUsers.filter((u) => !storedEmails.has(u.email.toLowerCase()));
        const all = [...uniqueDbUsers, ...stored];

        if (tab === "all") return all;
        return all.filter((u) => u.status === tab);
    },

    /**
     * Verify a user account
     */
    async verifyUser(userId) {
        try {
            await api.patch(`/auth/store-admin/${userId}/approve`);
        } catch {
            // Mock update fallback
        }

        const users = getStoredMockUsers();
        const updated = users.map((u) =>
            u.id === userId
                ? { ...u, status: "verified", rejectionReason: null, verifiedAt: new Date().toISOString() }
                : u
        );
        saveMockUsers(updated);
        return updated.find((u) => u.id === userId);
    },

    /**
     * Reject a user account with required reason
     */
    async rejectUser(userId, rejectionReason) {
        try {
            const res = await api.patch(`/admin/user-verifications/${userId}/reject`, { rejectionReason });
            if (res.data?.data) return res.data.data;
        } catch {
            // Mock update
        }

        const users = getStoredMockUsers();
        const updated = users.map((u) =>
            u.id === userId
                ? { ...u, status: "rejected", rejectionReason, rejectedAt: new Date().toISOString() }
                : u
        );
        saveMockUsers(updated);
        return updated.find((u) => u.id === userId);
    },

    /**
     * Request additional information from user
     */
    async requestAdditionalInfo(userId, notes) {
        try {
            const res = await api.post(`/admin/user-verifications/${userId}/request-info`, { notes });
            if (res.data?.data) return res.data.data;
        } catch {
            // Mock update
        }

        const users = getStoredMockUsers();
        const updated = users.map((u) =>
            u.id === userId
                ? { ...u, notes: notes, infoRequestedAt: new Date().toISOString() }
                : u
        );
        saveMockUsers(updated);
        return updated.find((u) => u.id === userId);
    },
};

