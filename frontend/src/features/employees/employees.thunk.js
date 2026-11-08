import { createAsyncThunk } from "@reduxjs/toolkit";
import { employeeService } from "./services/employeeService";

const getEmployeeListKey = (params = {}) => {
    const { organizationId = "", storeId = "" } = params || {};
    return `${organizationId}:${storeId}`;
};

const errorMessage = (error, fallback) =>
    error.response?.data?.message || error.message || fallback;

export const fetchEmployees = createAsyncThunk(
    "employees/fetchEmployees",
    async (options, { rejectWithValue }) => {
        try {
            const params = Object.fromEntries(
                Object.entries(options || {}).filter(([key]) => key !== "force"),
            );
            const response = await employeeService.getEmployees(params);
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to fetch employees"));
        }
    },
    {
        condition: (options, { getState }) => {
            const key = getEmployeeListKey(options);
            const { employeeRequests, employeeListsLoaded } = getState().employees;
            return !employeeRequests[key] && (options?.force || !employeeListsLoaded[key]);
        },
    },
);

export const fetchMyEmployee = createAsyncThunk(
    "employees/fetchMyEmployee",
    async (_, { rejectWithValue }) => {
        try {
            const response = await employeeService.getMyEmployee();
            return response.data?.data?.employee || response.data?.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to fetch your employee profile"));
        }
    },
    {
        condition: (_, { getState }) => {
            const { myEmployee, myEmployeeLoading } = getState().employees;
            return !myEmployee && !myEmployeeLoading;
        },
    },
);

export const createEmployee = createAsyncThunk(
    "employees/createEmployee",
    async (data, { rejectWithValue }) => {
        try {
            const response = await employeeService.createEmployee(data);
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to create employee"));
        }
    },
);

export const updateEmployee = createAsyncThunk(
    "employees/updateEmployee",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await employeeService.updateEmployee(id, data);
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to update employee"));
        }
    },
);

export const deleteEmployee = createAsyncThunk(
    "employees/deleteEmployee",
    async (id, { rejectWithValue }) => {
        try {
            await employeeService.deleteEmployee(id);
            return id;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to delete employee"));
        }
    },
);

export { getEmployeeListKey };
