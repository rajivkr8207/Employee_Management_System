import { createAsyncThunk } from "@reduxjs/toolkit";
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

export const fetchMyAttendanceRecords = createAsyncThunk(
    "attendance/fetchMine",
    async (params, { rejectWithValue }) => {
        try {
            const response = await attendanceService.getMine(params);
            return response.data?.data?.attendance || [];
        } catch (error) {
            return rejectWithValue(getErrorMessage(error));
        }
    },
);

export const fetchManagedAttendanceRecords = createAsyncThunk(
    "attendance/fetchManaged",
    async (params, { rejectWithValue }) => {
        try {
            const response = await attendanceService.getRecords(params);
            return response.data?.data?.attendance || [];
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
            return response.data?.data;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error));
        }
    },
);
