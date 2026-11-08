import { createAsyncThunk } from "@reduxjs/toolkit";
import { leaveService } from "./services/leaveService";

const errorMessage = (error) =>
    error.response?.data?.message || error.message || "Unable to load leave requests.";

export const fetchMyLeaves = createAsyncThunk(
    "leave/fetchMine",
    async (params, { rejectWithValue }) => {
        try {
            const response = await leaveService.getMine(params);
            return response.data?.data?.leaves || [];
        } catch (error) {
            return rejectWithValue(errorMessage(error));
        }
    },
);

export const fetchManagedLeaves = createAsyncThunk(
    "leave/fetchManaged",
    async (params, { rejectWithValue }) => {
        try {
            const response = await leaveService.getLeaves(params);
            return response.data?.data?.leaves || [];
        } catch (error) {
            return rejectWithValue(errorMessage(error));
        }
    },
);

export const applyForLeave = createAsyncThunk(
    "leave/apply",
    async (data, { rejectWithValue }) => {
        try {
            const response = await leaveService.apply(data);
            return response.data?.data?.leave;
        } catch (error) {
            return rejectWithValue(errorMessage(error));
        }
    },
);

export const reviewLeave = createAsyncThunk(
    "leave/review",
    async ({ leaveId, organizationId, status }, { rejectWithValue }) => {
        try {
            const response = await leaveService.review(leaveId, organizationId, status);
            return response.data?.data?.leave;
        } catch (error) {
            return rejectWithValue(errorMessage(error));
        }
    },
);

export const cancelLeave = createAsyncThunk(
    "leave/cancel",
    async ({ leaveId, organizationId }, { rejectWithValue }) => {
        try {
            await leaveService.cancel(leaveId, organizationId);
            return leaveId;
        } catch (error) {
            return rejectWithValue(errorMessage(error));
        }
    },
);
