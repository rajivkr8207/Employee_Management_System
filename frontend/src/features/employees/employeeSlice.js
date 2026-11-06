import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { employeeService } from "./services/employeeService";

const getEmployeeListKey = (params = {}) => {
  const { organizationId = "", storeId = "" } = params || {};
  return `${organizationId}:${storeId}`;
};

export const fetchEmployees = createAsyncThunk(
  "employees/fetchEmployees",
  async (options, { rejectWithValue }) => {
    try {
      const params = Object.fromEntries(
        Object.entries(options || {}).filter(([key]) => key !== "force")
      );
      const res = await employeeService.getEmployees(params);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch employees");
    }
  },
  {
    condition: (options, { getState }) => {
      const key = getEmployeeListKey(options);
      const { employeeRequests, employeeListsLoaded } = getState().employees;
      return !employeeRequests[key] && (options?.force || !employeeListsLoaded[key]);
    },
  }
);

export const fetchMyEmployee = createAsyncThunk(
  "employees/fetchMyEmployee",
  async (_, { rejectWithValue }) => {
    try {
      const res = await employeeService.getMyEmployee();
      return res.data?.data?.employee || res.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch your employee profile");
    }
  },
  {
    condition: (_, { getState }) => {
      const { myEmployee, myEmployeeLoading } = getState().employees;
      return !myEmployee && !myEmployeeLoading;
    },
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
  },
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
      .addCase("auth/clearAuth", (state) => {
        state.employees = [];
        state.myEmployee = null;
        state.loading = false;
        state.myEmployeeLoading = false;
        state.employeeRequests = {};
        state.employeeListsLoaded = {};
        state.currentEmployeeListKey = null;
        state.myEmployeeError = null;
      })
      .addCase("auth/logout/fulfilled", (state) => {
        state.employees = [];
        state.myEmployee = null;
        state.loading = false;
        state.myEmployeeLoading = false;
        state.employeeRequests = {};
        state.employeeListsLoaded = {};
        state.currentEmployeeListKey = null;
        state.myEmployeeError = null;
      })
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
