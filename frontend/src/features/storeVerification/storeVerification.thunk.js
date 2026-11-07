import { createAsyncThunk } from "@reduxjs/toolkit";
import { storeVerificationService } from "./services/storeVerificationService";

const errorMessage = (error, fallback) =>
    error.response?.data?.message || error.message || fallback;

export const fetchStoresThunk = createAsyncThunk(
    "storeVerification/fetchStores",
    async (tab = "all", { rejectWithValue }) => {
        try {
            return await storeVerificationService.getStores(tab);
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to fetch stores"));
        }
    },
);

export const approveStoreThunk = createAsyncThunk(
    "storeVerification/approveStore",
    async (storeId, { rejectWithValue }) => {
        try {
            return await storeVerificationService.approveStore(storeId);
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to approve store"));
        }
    },
);

export const rejectStoreThunk = createAsyncThunk(
    "storeVerification/rejectStore",
    async ({ storeId, reason }, { rejectWithValue }) => {
        try {
            return await storeVerificationService.rejectStore(storeId, reason);
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to reject store"));
        }
    },
);
