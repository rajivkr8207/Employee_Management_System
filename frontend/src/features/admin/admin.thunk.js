import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminService } from "./services/adminService";

const errorMessage = (error, fallback) =>
    error.response?.data?.message || error.message || fallback;

export const fetchAdminDashboardStatsThunk = createAsyncThunk(
    "admin/fetchDashboardStats",
    async (_, { rejectWithValue }) => {
        try {
            const response = await adminService.getAdminDashboardStats();
            return response.data.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to fetch admin stats"));
        }
    },
);

const createDirectoryThunk = (actionName, serviceMethod, responseKey) =>
    createAsyncThunk(`admin/${actionName}`, async (_, { rejectWithValue }) => {
        try {
            const response = await adminService[serviceMethod]();
            return response.data.data[responseKey];
        } catch (error) {
            return rejectWithValue(errorMessage(error, `Failed to fetch ${responseKey}`));
        }
    });

export const fetchAdminUsersThunk = createDirectoryThunk("fetchUsers", "getUsers", "users");
export const fetchAdminStoresThunk = createDirectoryThunk("fetchStores", "getStores", "stores");
export const fetchAdminEmployeesThunk = createDirectoryThunk(
    "fetchEmployees",
    "getEmployees",
    "employees",
);
