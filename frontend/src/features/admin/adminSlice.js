import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminService } from "./services/adminService";

export const fetchAdminDashboardStatsThunk = createAsyncThunk(
    "admin/fetchDashboardStats",
    async (_, { rejectWithValue }) => {
        try {
            return await adminService.getAdminDashboardStats();
        } catch (err) {
            return rejectWithValue(err.message || "Failed to fetch admin stats");
        }
    }
);

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        stats: null,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminDashboardStatsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdminDashboardStatsThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchAdminDashboardStatsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default adminSlice.reducer;

