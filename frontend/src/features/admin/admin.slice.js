import { createSlice } from "@reduxjs/toolkit";
import {
    fetchAdminDashboardStatsThunk,
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
    },
});

export default adminSlice.reducer;
