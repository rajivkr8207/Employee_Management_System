import { createAsyncThunk } from "@reduxjs/toolkit";
import { organizationService } from "./services/organizationService";

const errorMessage = (error, fallback) =>
    error.response?.data?.message || error.message || fallback;

export const fetchMyOrganization = createAsyncThunk(
    "organization/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const response = await organizationService.getMyOrganization();
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to fetch organization"));
        }
    },
);

export const createOrganization = createAsyncThunk(
    "organization/create",
    async (data, { rejectWithValue }) => {
        try {
            const response = await organizationService.createOrganization(data);
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to create organization"));
        }
    },
);

export const updateMyOrganization = createAsyncThunk(
    "organization/update",
    async (data, { rejectWithValue }) => {
        try {
            const response = await organizationService.updateMyOrganization(data);
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to update organization"));
        }
    },
);
