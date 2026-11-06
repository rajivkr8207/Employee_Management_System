import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { attendanceService } from "./services/attendanceService";

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Unable to update attendance.";

export const fetchTodayAttendance = createAsyncThunk(
  "attendance/fetchToday",
  async ({ organizationId, location }, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getToday(organizationId, location);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const recordCheckIn = createAsyncThunk(
  "attendance/checkIn",
  async ({ organizationId, location, image }, { rejectWithValue }) => {
    try {
      const response = await attendanceService.checkIn(organizationId, location, image);
      return response.data?.data?.attendance;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const recordCheckOut = createAsyncThunk(
  "attendance/checkOut",
  async ({ organizationId, location, image }, { rejectWithValue }) => {
    try {
      const response = await attendanceService.checkOut(organizationId, location, image);
      return response.data?.data?.attendance;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const enrollMyFace = createAsyncThunk(
  "attendance/enrollFace",
  async (image, { rejectWithValue }) => {
    try {
      const response = await attendanceService.enrollFace(image);
      return response.data?.data?.user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const initialState = {
  today: null,
  loading: false,
  actionLoading: false,
  enrollmentLoading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.today = action.payload;
      })
      .addCase(fetchTodayAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(recordCheckIn.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(recordCheckIn.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.today) state.today.attendance = action.payload;
      })
      .addCase(recordCheckIn.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(recordCheckOut.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(recordCheckOut.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.today) state.today.attendance = action.payload;
      })
      .addCase(recordCheckOut.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(enrollMyFace.pending, (state) => {
        state.enrollmentLoading = true;
        state.error = null;
      })
      .addCase(enrollMyFace.fulfilled, (state) => {
        state.enrollmentLoading = false;
        if (state.today) state.today.faceEnrolled = true;
      })
      .addCase(enrollMyFace.rejected, (state, action) => {
        state.enrollmentLoading = false;
        state.error = action.payload;
      })
      .addCase("auth/clearAuth", () => initialState)
      .addCase("auth/logout/fulfilled", () => initialState);
  },
});

export default attendanceSlice.reducer;
