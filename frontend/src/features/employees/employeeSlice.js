import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { employeeService } from "./services/employeeService";

export const fetchEmployees = createAsyncThunk(
  "employees/fetchEmployees",
  async (params, { rejectWithValue }) => {
    try {
      const res = await employeeService.getEmployees(params);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch employees");
    }
  }
);

export const createEmployee = createAsyncThunk(
  "employees/createEmployee",
  async (data, { rejectWithValue }) => {
    try {
      const res = await employeeService.createEmployee(data);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create employee");
    }
  }
);

export const updateEmployee = createAsyncThunk(
  "employees/updateEmployee",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await employeeService.updateEmployee(id, data);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update employee");
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  "employees/deleteEmployee",
  async (id, { rejectWithValue }) => {
    try {
      await employeeService.deleteEmployee(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete employee");
    }
  }
);

const employeeSlice = createSlice({
  name: "employees",
  initialState: {
    employees: [],
    total: 0,
    loading: false,
    creating: false,
    error: null,
  },
  reducers: {
    clearEmployeeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.employees || [];
        state.total = action.payload?.total || state.employees.length;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEmployee.pending, (state) => {
        state.creating = true;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.creating = false;
        const emp = action.payload?.employee || action.payload;
        if (emp) state.employees.unshift(emp);
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const updated = action.payload?.employee || action.payload;
        if (updated?._id) {
          const idx = state.employees.findIndex((e) => e._id === updated._id);
          if (idx !== -1) state.employees[idx] = updated;
        }
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter((e) => e._id !== action.payload);
      });
  },
});

export const { clearEmployeeError } = employeeSlice.actions;
export default employeeSlice.reducer;
