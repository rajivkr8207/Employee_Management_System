import { createSlice } from "@reduxjs/toolkit";
import {
    fetchAdminDashboardStatsThunk,
    fetchAdminActivityLogsThunk,
    fetchAdminEmployeesThunk,
    fetchAdminStoresThunk,
    fetchAdminUsersThunk,
} from "./admin.thunk";

const initialState = {
    stats: null,
    statsLoading: false,
    statsError: null,
    users: [],
    usersLoading: false,
    usersError: null,
    stores: [],
    storesLoading: false,
    storesError: null,
    employees: [],
    employeesLoading: false,
    employeesError: null,
    activityLogs: [],
    activityLogsPagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    activityLogsLoading: false,
    activityLogsError: null,
};

const adminSlice = createSlice({
    name: "admin",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminDashboardStatsThunk.pending, (state) => {
                state.statsLoading = true;
                state.statsError = null;
            })
            .addCase(fetchAdminDashboardStatsThunk.fulfilled, (state, action) => {
                state.statsLoading = false;
                state.stats = action.payload;
            })
            .addCase(fetchAdminDashboardStatsThunk.rejected, (state, action) => {
                state.statsLoading = false;
                state.statsError = action.payload;
            });

        [
            [fetchAdminUsersThunk, "users"],
            [fetchAdminStoresThunk, "stores"],
            [fetchAdminEmployeesThunk, "employees"],
        ].forEach(([thunk, key]) => {
            builder
                .addCase(thunk.pending, (state) => {
                    state[`${key}Loading`] = true;
                    state[`${key}Error`] = null;
                })
                .addCase(thunk.fulfilled, (state, action) => {
                    state[`${key}Loading`] = false;
                    state[key] = action.payload;
                })
                .addCase(thunk.rejected, (state, action) => {
                    state[`${key}Loading`] = false;
                    state[`${key}Error`] = action.payload;
                });
        });

        builder
            .addCase(fetchAdminActivityLogsThunk.pending, (state) => {
                state.activityLogsLoading = true;
                state.activityLogsError = null;
            })
            .addCase(fetchAdminActivityLogsThunk.fulfilled, (state, action) => {
                state.activityLogsLoading = false;
                state.activityLogs = action.payload.logs;
                state.activityLogsPagination = action.payload.pagination;
            })
            .addCase(fetchAdminActivityLogsThunk.rejected, (state, action) => {
                state.activityLogsLoading = false;
                state.activityLogsError = action.payload;
            });
    },
});

export default adminSlice.reducer;
