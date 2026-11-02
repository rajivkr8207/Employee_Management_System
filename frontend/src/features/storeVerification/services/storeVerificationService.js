import { api } from "../../../lib/api";

const STORAGE_KEY = "ems_mock_store_verifications";

const INITIAL_MOCK_STORES = [
    {
        id: "str_201",
        name: "Nexus Superstore - Bandra",
        code: "STR-MUM-01",
        gstNumber: "27AABCN1234F1Z8",
        registrationNumber: "REG-MH-2026-8941",
        address: {
            street: "Plot 14, Linking Road, Bandra West",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400050",
            country: "India",
        },
        contactNumber: "022-26401122",
        email: "bandra@nexusretail.in",
        owner: {
            id: "usr_101",
            name: "Vikram Malhotra",
            email: "vikram.malhotra@retailchain.com",
            mobile: "9820123456",
            role: "Store Admin",
        },
        documents: [
            { type: "Trade License", name: "trade_license_bandra.pdf", verified: true },
            { type: "GST Certificate", name: "gst_27AABCN.pdf", verified: true },
            { type: "Rental / Lease Agreement", name: "lease_nexus_bandra.pdf", verified: false },
        ],
        status: "pending",
        rejectionReason: null,
        notes: null,
        registrationDate: "2026-10-24T11:00:00Z",
    },
    {
        id: "str_202",
        name: "QuickMart Express - Indiranagar",
        code: "STR-BLR-02",
        gstNumber: "29AABCP9876K1Z3",
        registrationNumber: "REG-KA-2026-4432",
        address: {
            street: "100ft Road, HAL 2nd Stage, Indiranagar",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560038",
            country: "India",
        },
        contactNumber: "080-41223344",
        email: "indiranagar@quickmart.com",
        owner: {
            id: "usr_104",
            name: "Pooja Hegde",
            email: "pooja.hegde@retailhub.com",
            mobile: "9845123456",
            role: "Store Admin",
        },
        documents: [
            { type: "Shop & Establishment Certificate", name: "shop_est_blr.pdf", verified: true },
            { type: "GST Registration", name: "gst_29AABCP.pdf", verified: true },
            { type: "FSSAI License", name: "fssai_cert.pdf", verified: true },
        ],
        status: "approved",
        rejectionReason: null,
        notes: "Approved after address verification visit.",
        registrationDate: "2026-10-15T09:30:00Z",
        approvedAt: "2026-10-18T14:00:00Z",
    },
    {
        id: "str_203",
        name: "Apex Hypermarket - CyberCity",
        code: "STR-GGN-03",
        gstNumber: "06AABCQ5432M1Z1",
        registrationNumber: "REG-HR-2026-1190",
        address: {
            street: "DLF CyberCity, Phase 2",
            city: "Gurugram",
            state: "Haryana",
            pincode: "122002",
            country: "India",
        },
        contactNumber: "0124-4908877",
        email: "gurugram@apexmart.com",
        owner: {
            id: "usr_106",
            name: "Deepak Choudhury",
            email: "deepak.c@apexmart.com",
            mobile: "9811223344",
            role: "Store Admin",
        },
        documents: [
            { type: "Commercial Lease Deed", name: "cybercity_lease.pdf", verified: false },
            { type: "Electricity Bill (Address Proof)", name: "elec_bill_sep26.pdf", verified: false },
        ],
        status: "pending",
        rejectionReason: null,
        notes: null,
        registrationDate: "2026-10-27T16:20:00Z",
    },
    {
        id: "str_204",
        name: "Metro Retail - Connaught Place",
        code: "STR-DEL-04",
        gstNumber: "07AABCR8877J1Z9",
        registrationNumber: "REG-DL-2026-0034",
        address: {
            street: "Block E, Inner Circle, CP",
            city: "New Delhi",
            state: "Delhi",
            pincode: "110001",
            country: "India",
        },
        contactNumber: "011-23344556",
        email: "cp@metroretail.com",
        owner: {
            id: "usr_107",
            name: "Sanjay Singhania",
            email: "sanjay@metroretail.com",
            mobile: "9810112233",
            role: "Store Admin",
        },
        documents: [
            { type: "NOC from Fire Dept", name: "fire_noc_cp.pdf", verified: false },
        ],
        status: "rejected",
        rejectionReason: "Fire Safety NOC expired. Building municipal occupancy certificate missing.",
        notes: null,
        registrationDate: "2026-10-12T13:00:00Z",
        rejectedAt: "2026-10-14T15:30:00Z",
    },
];

function getStoredMockStores() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return JSON.parse(data);
    } catch {
        // fallback
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_STORES));
    return INITIAL_MOCK_STORES;
}

function saveMockStores(stores) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
    } catch {
        // ignore
    }
}

export const storeVerificationService = {
    async getStores(tab = "all") {
        try {
            const res = await api.get(`/admin/store-verifications?status=${tab}`);
            if (res.data?.data) return res.data.data;
        } catch {
            // fallback to mock
        }

        const all = getStoredMockStores();
        if (tab === "all") return all;
        return all.filter((s) => s.status === tab);
    },

    async approveStore(storeId) {
        try {
            const res = await api.patch(`/admin/store-verifications/${storeId}/approve`);
            if (res.data?.data) return res.data.data;
        } catch {
            // fallback
        }

        const stores = getStoredMockStores();
        const updated = stores.map((s) =>
            s.id === storeId
                ? { ...s, status: "approved", rejectionReason: null, approvedAt: new Date().toISOString() }
                : s
        );
        saveMockStores(updated);
        return updated.find((s) => s.id === storeId);
    },

    async rejectStore(storeId, rejectionReason) {
        try {
            const res = await api.patch(`/admin/store-verifications/${storeId}/reject`, { rejectionReason });
            if (res.data?.data) return res.data.data;
        } catch {
            // fallback
        }

        const stores = getStoredMockStores();
        const updated = stores.map((s) =>
            s.id === storeId
                ? { ...s, status: "rejected", rejectionReason, rejectedAt: new Date().toISOString() }
                : s
        );
        saveMockStores(updated);
        return updated.find((s) => s.id === storeId);
    },

    async requestAdditionalDocs(storeId, notes) {
        try {
            const res = await api.post(`/admin/store-verifications/${storeId}/request-docs`, { notes });
            if (res.data?.data) return res.data.data;
        } catch {
            // fallback
        }

        const stores = getStoredMockStores();
        const updated = stores.map((s) =>
            s.id === storeId
                ? { ...s, notes, docsRequestedAt: new Date().toISOString() }
                : s
        );
        saveMockStores(updated);
        return updated.find((s) => s.id === storeId);
    },
};

