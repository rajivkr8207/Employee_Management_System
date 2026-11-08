import { createSlice } from "@reduxjs/toolkit";
import {
    enrollMyFace,
    fetchManagedAttendanceRecords,
    fetchMyAttendanceRecords,
    fetchTodayAttendance,
    recordCheckIn,
    recordCheckOut,
} from "./attendance.thunk";

const initialState = {
    today: null,
    loading: false,
    actionLoading: false,
    enrollmentLoading: false,
    error: null,
    records: [],
    recordsLoading: false,
    recordsError: null,
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
            .addCase(fetchMyAttendanceRecords.pending, (state) => {
                state.recordsLoading = true;
                state.recordsError = null;
            })
            .addCase(fetchMyAttendanceRecords.fulfilled, (state, action) => {
                state.recordsLoading = false;
                state.records = action.payload;
            })
            .addCase(fetchMyAttendanceRecords.rejected, (state, action) => {
                state.recordsLoading = false;
                state.recordsError = action.payload;
            })
            .addCase(fetchManagedAttendanceRecords.pending, (state) => {
                state.recordsLoading = true;
                state.recordsError = null;
            })
            .addCase(fetchManagedAttendanceRecords.fulfilled, (state, action) => {
                state.recordsLoading = false;
                state.records = action.payload;
            })
            .addCase(fetchManagedAttendanceRecords.rejected, (state, action) => {
                state.recordsLoading = false;
                state.recordsError = action.payload;
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
