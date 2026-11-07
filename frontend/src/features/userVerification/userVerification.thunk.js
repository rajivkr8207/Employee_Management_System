import { createAsyncThunk } from "@reduxjs/toolkit";
import { userVerificationService } from "./services/userVerificationService";

const errorMessage = (error, fallback) =>
    error.response?.data?.message || error.message || fallback;

export const fetchUsersThunk = createAsyncThunk(
    "userVerification/fetchUsers",
    async (tab = "all", { rejectWithValue }) => {
        try {
            return await userVerificationService.getUsers(tab);
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to fetch users"));
        }
    },
);

export const verifyUserThunk = createAsyncThunk(
    "userVerification/verifyUser",
    async (userId, { rejectWithValue }) => {
        try {
            return await userVerificationService.verifyUser(userId);
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to verify user"));
        }
    },
);

export const rejectUserThunk = createAsyncThunk(
    "userVerification/rejectUser",
    async ({ userId, reason }, { rejectWithValue }) => {
        try {
            return await userVerificationService.rejectUser(userId, reason);
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to reject user"));
        }
    },
);
