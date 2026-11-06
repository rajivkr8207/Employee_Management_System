import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { storeVerificationService } from "./services/storeVerificationService";

export const fetchStoresThunk = createAsyncThunk(
    "storeVerification/fetchStores",
    async (tab = "all", { rejectWithValue }) => {
        try {
            return await storeVerificationService.getStores(tab);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to fetch stores");
        }
    }
);

export const approveStoreThunk = createAsyncThunk(
    "storeVerification/approveStore",
    async (storeId, { rejectWithValue }) => {
        try {
            return await storeVerificationService.approveStore(storeId);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to approve store");
        }
    }
);

export const rejectStoreThunk = createAsyncThunk(
    "storeVerification/rejectStore",
    async ({ storeId, reason }, { rejectWithValue }) => {
        try {
            return await storeVerificationService.rejectStore(storeId, reason);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to reject store");
        }
    }
);

const storeVerificationSlice = createSlice({
    name: "storeVerification",
    initialState: {
        stores: [],
        selectedStore: null,
        activeTab: "all", // all | pending | approved | rejected
        loading: false,
        actionLoading: false,
        error: null,
    },
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
        setSelectedStore: (state, action) => {
            state.selectedStore = action.payload;
        },
        clearSelectedStore: (state) => {
            state.selectedStore = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch stores
            .addCase(fetchStoresThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStoresThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.stores = action.payload;
            })
            .addCase(fetchStoresThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Approve
            .addCase(approveStoreThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(approveStoreThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.stores = state.stores.map((s) => (s.id === updated.id ? updated : s));
                if (state.selectedStore?.id === updated.id) {
                    state.selectedStore = updated;
                }
            })
            .addCase(approveStoreThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            // Reject
            .addCase(rejectStoreThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(rejectStoreThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.stores = state.stores.map((s) => (s.id === updated.id ? updated : s));
                if (state.selectedStore?.id === updated.id) {
                    state.selectedStore = updated;
                }
            })
            .addCase(rejectStoreThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            });
    },
});

export const { setActiveTab, setSelectedStore, clearSelectedStore } = storeVerificationSlice.actions;
export default storeVerificationSlice.reducer;
