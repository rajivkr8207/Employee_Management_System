import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { managerVerificationService } from "./services/managerVerificationService";

export const fetchManagersThunk = createAsyncThunk(
    "managerVerification/fetchManagers",
    async (tab = "all", { rejectWithValue }) => {
        try {
            return await managerVerificationService.getManagers(tab);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to fetch managers");
        }
    }
);

export const approveManagerThunk = createAsyncThunk(
    "managerVerification/approveManager",
    async (managerId, { rejectWithValue }) => {
        try {
            return await managerVerificationService.approveManager(managerId);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to approve manager");
        }
    }
);

export const rejectManagerThunk = createAsyncThunk(
    "managerVerification/rejectManager",
    async ({ managerId, reason }, { rejectWithValue }) => {
        try {
            return await managerVerificationService.rejectManager(managerId, reason);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to reject manager");
        }
    }
);

export const requestManagerInfoThunk = createAsyncThunk(
    "managerVerification/requestInfo",
    async ({ managerId, notes }, { rejectWithValue }) => {
        try {
            return await managerVerificationService.requestAdditionalInfo(managerId, notes);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to request additional information");
        }
    }
);

const managerVerificationSlice = createSlice({
    name: "managerVerification",
    initialState: {
        managers: [],
        selectedManager: null,
        activeTab: "all", // all | pending | approved | rejected
        loading: false,
        actionLoading: false,
        error: null,
    },
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
        setSelectedManager: (state, action) => {
            state.selectedManager = action.payload;
        },
        clearSelectedManager: (state) => {
            state.selectedManager = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch managers
            .addCase(fetchManagersThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchManagersThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.managers = action.payload;
            })
            .addCase(fetchManagersThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Approve
            .addCase(approveManagerThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(approveManagerThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.managers = state.managers.map((m) => (m.id === updated.id ? updated : m));
                if (state.selectedManager?.id === updated.id) {
                    state.selectedManager = updated;
                }
            })
            .addCase(approveManagerThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            // Reject
            .addCase(rejectManagerThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(rejectManagerThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.managers = state.managers.map((m) => (m.id === updated.id ? updated : m));
                if (state.selectedManager?.id === updated.id) {
                    state.selectedManager = updated;
                }
            })
            .addCase(rejectManagerThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            // Request info
            .addCase(requestManagerInfoThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(requestManagerInfoThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.managers = state.managers.map((m) => (m.id === updated.id ? updated : m));
                if (state.selectedManager?.id === updated.id) {
                    state.selectedManager = updated;
                }
            })
            .addCase(requestManagerInfoThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            });
    },
});

export const { setActiveTab, setSelectedManager, clearSelectedManager } = managerVerificationSlice.actions;
export default managerVerificationSlice.reducer;

