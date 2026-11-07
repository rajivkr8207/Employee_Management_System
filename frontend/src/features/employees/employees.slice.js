import { createSlice } from "@reduxjs/toolkit";
import {
    createEmployee,
    deleteEmployee,
    fetchEmployees,
    fetchMyEmployee,
    getEmployeeListKey,
    updateEmployee,
} from "./employees.thunk";

const initialState = {
    employees: [],
    myEmployee: null,
    employeeRequests: {},
    employeeListsLoaded: {},
    currentEmployeeListKey: null,
    total: 0,
    loading: false,
    myEmployeeLoading: false,
    myEmployeeError: null,
    creating: false,
    error: null,
};

const employeesSlice = createSlice({
    name: "employees",
    initialState,
    reducers: {
        clearEmployeeError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyEmployee.pending, (state) => {
                state.myEmployeeLoading = true;
                state.myEmployeeError = null;
            })
            .addCase(fetchMyEmployee.fulfilled, (state, action) => {
                state.myEmployeeLoading = false;
                state.myEmployee = action.payload;
            })
            .addCase(fetchMyEmployee.rejected, (state, action) => {
                state.myEmployeeLoading = false;
                state.myEmployeeError = action.payload;
            })
            .addCase("auth/clearAuth", () => initialState)
            .addCase("auth/logout/fulfilled", () => initialState)
            .addCase(fetchEmployees.pending, (state, action) => {
                state.loading = true;
                state.error = null;
                state.employeeRequests[getEmployeeListKey(action.meta.arg)] = true;
            })
            .addCase(fetchEmployees.fulfilled, (state, action) => {
                const key = getEmployeeListKey(action.meta.arg);
                delete state.employeeRequests[key];
                state.employeeListsLoaded[key] = true;
                state.currentEmployeeListKey = action.meta.arg;
                state.loading = Object.keys(state.employeeRequests).length > 0;
                state.employees = Array.isArray(action.payload)
                    ? action.payload
                    : action.payload?.employees || [];
                state.total = action.payload?.total || state.employees.length;
            })
            .addCase(fetchEmployees.rejected, (state, action) => {
                delete state.employeeRequests[getEmployeeListKey(action.meta.arg)];
                state.loading = Object.keys(state.employeeRequests).length > 0;
                state.error = action.payload;
            })
            .addCase(createEmployee.pending, (state) => {
                state.creating = true;
            })
            .addCase(createEmployee.fulfilled, (state, action) => {
                state.creating = false;
                const employee = action.payload?.employee || action.payload;
                if (employee) state.employees.unshift(employee);
            })
            .addCase(createEmployee.rejected, (state, action) => {
                state.creating = false;
                state.error = action.payload;
            })
            .addCase(updateEmployee.fulfilled, (state, action) => {
                const updated = action.payload?.employee || action.payload;
                if (updated?._id) {
                    const index = state.employees.findIndex((employee) => employee._id === updated._id);
                    if (index !== -1) state.employees[index] = updated;
                }
            })
            .addCase(deleteEmployee.fulfilled, (state, action) => {
                state.employees = state.employees.filter((employee) => employee._id !== action.payload);
            });
    },
});

export const { clearEmployeeError } = employeesSlice.actions;
export default employeesSlice.reducer;
