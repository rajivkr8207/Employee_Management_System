import { createAsyncThunk } from "@reduxjs/toolkit";
import { managerVerificationService } from "./services/managerVerificationService";

const errorMessage = (error) =>
    error.response?.data?.message || error.message || "Manager verification request failed.";

export const fetchManagersThunk = createAsyncThunk(
    "managerVerification/fetchManagers",
    async (tab = "all", { rejectWithValue }) => {
        try {
            return await managerVerificationService.getManagers(tab);
        } catch (error) {
            return rejectWithValue(errorMessage(error));
        }
    },
);

export const approveManagerThunk = createAsyncThunk(
    "managerVerification/approveManager",
    async (managerId, { rejectWithValue }) => {
        try {
            return await managerVerificationService.approveManager(managerId);
        } catch (error) {
            return rejectWithValue(errorMessage(error));
        }
    },
);

export const rejectManagerThunk = createAsyncThunk(
    "managerVerification/rejectManager",
    async ({ managerId, reason }, { rejectWithValue }) => {
        try {
            return await managerVerificationService.rejectManager(managerId, reason);
        } catch (error) {
            return rejectWithValue(errorMessage(error));
        }
    },
);
