import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminService } from "./services/adminService";

export const fetchAdminDashboardStatsThunk = createAsyncThunk(
    "admin/fetchDashboardStats",
    async (_, { rejectWithValue }) => {
        try {
            const response = await adminService.getAdminDashboardStats();
            return response.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch admin stats");
        }
    }
);

const createDirectoryThunk = (actionName, serviceMethod, responseKey) =>
    createAsyncThunk(`admin/${actionName}`, async (_, { rejectWithValue }) => {
        try {
            const response = await adminService[serviceMethod]();
            return response.data.data[responseKey];
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || err.message || `Failed to fetch ${responseKey}`
            );
        }
    });

export const fetchAdminUsersThunk = createDirectoryThunk("fetchUsers", "getUsers", "users");
export const fetchAdminStoresThunk = createDirectoryThunk("fetchStores", "getStores", "stores");
export const fetchAdminEmployeesThunk = createDirectoryThunk("fetchEmployees", "getEmployees", "employees");

const adminSlice = createSlice({
    name: "admin",
    initialState: {
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
    },
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
