import { createAsyncThunk } from "@reduxjs/toolkit";
import { shiftService } from "./services/shiftService";

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
            return rejectWithValue(
                error.response?.data?.message || "Failed to load the shift schedule.",
            );
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
            return rejectWithValue(
                error.response?.data?.message || "Failed to schedule the employee.",
            );
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
            return rejectWithValue(
                error.response?.data?.message || "Failed to remove the shift assignment.",
            );
        }
    },
);
