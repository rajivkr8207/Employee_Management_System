import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { shiftService } from "./services/shiftService";

const getId = (value) => (typeof value === "string" ? value : value?._id);

export const fetchShiftSchedule = createAsyncThunk(
  "shiftSchedule/fetch",
  async ({ organizationId, storeId, date }, { rejectWithValue }) => {
    try {
      const params = { organizationId, storeId };
      const [shiftResponse, assignmentResponse] = await Promise.all([
        shiftService.getShifts(params),
        shiftService.getAssignments({ ...params, date }),
      ]);
      return {
        organizationId,
        storeId,
        date,
        shifts: shiftResponse.data?.data?.shifts || [],
        assignments: assignmentResponse.data?.data?.assignments || [],
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to load the shift schedule.");
    }
  },
);

export const createShiftTemplate = createAsyncThunk(
  "shiftSchedule/createShift",
  async (data, { rejectWithValue }) => {
    try {
      const response = await shiftService.createShift(data);
      return response.data?.data?.shift;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create the shift.");
    }
  },
);

export const createShiftAssignment = createAsyncThunk(
  "shiftSchedule/createAssignment",
  async (data, { rejectWithValue }) => {
    try {
      const response = await shiftService.createAssignment(data);
      return response.data?.data?.assignment;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to schedule the employee.");
    }
  },
);

export const deleteShiftAssignment = createAsyncThunk(
  "shiftSchedule/deleteAssignment",
  async ({ assignmentId, organizationId }, { rejectWithValue }) => {
    try {
      await shiftService.deleteAssignment(assignmentId, organizationId);
      return assignmentId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to remove the shift assignment.");
    }
  },
);

const initialState = {
  shifts: [],
  assignments: [],
  organizationId: null,
  storeId: null,
  date: null,
  loading: false,
  saving: false,
  error: null,
  notice: null,
  currentRequestId: null,
};

const shiftSlice = createSlice({
  name: "shiftSchedule",
  initialState,
  reducers: {
    clearShiftFeedback: (state) => {
      state.error = null;
      state.notice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShiftSchedule.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.notice = null;
        state.currentRequestId = action.meta.requestId;
        state.shifts = [];
        state.assignments = [];
      })
      .addCase(fetchShiftSchedule.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.currentRequestId = null;
        state.organizationId = action.payload.organizationId;
        state.storeId = action.payload.storeId;
        state.date = action.payload.date;
        state.shifts = action.payload.shifts;
        state.assignments = action.payload.assignments;
      })
      .addCase(fetchShiftSchedule.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.currentRequestId = null;
        state.error = action.payload;
      })
      .addCase(createShiftTemplate.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.notice = null;
      })
      .addCase(createShiftTemplate.fulfilled, (state, action) => {
        state.saving = false;
        if (getId(action.payload?.storeId) === state.storeId) state.shifts.push(action.payload);
        state.notice = "Shift template created.";
      })
      .addCase(createShiftTemplate.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(createShiftAssignment.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.notice = null;
      })
      .addCase(createShiftAssignment.fulfilled, (state, action) => {
        state.saving = false;
        if (
          getId(action.payload?.storeId) === state.storeId &&
          action.payload?.date === state.date
        ) {
          state.assignments.push(action.payload);
        }
        state.notice = "Employee shift scheduled.";
      })
      .addCase(createShiftAssignment.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(deleteShiftAssignment.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.notice = null;
      })
      .addCase(deleteShiftAssignment.fulfilled, (state, action) => {
        state.saving = false;
        state.assignments = state.assignments.filter(
          (assignment) => assignment._id !== action.payload,
        );
        state.notice = "Shift assignment removed.";
      })
      .addCase(deleteShiftAssignment.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase("auth/clearAuth", () => initialState)
      .addCase("auth/logout/fulfilled", () => initialState);
  },
});

export const { clearShiftFeedback } = shiftSlice.actions;
export default shiftSlice.reducer;
