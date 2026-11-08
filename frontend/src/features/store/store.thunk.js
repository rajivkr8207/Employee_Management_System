import { createAsyncThunk } from "@reduxjs/toolkit";
import { storeService } from "./services/storeService";

const errorMessage = (error, fallback) =>
    error.response?.data?.message || error.message || fallback;

export const fetchMyStores = createAsyncThunk(
    "store/fetchMyStores",
    async (_, { rejectWithValue }) => {
        try {
            const response = await storeService.getMyStores();
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to fetch stores"));
        }
    },
    {
        condition: (options, { getState }) => {
            const { loading, storesLoaded } = getState().store;
            return !loading && (options?.force || !storesLoaded);
        },
    },
);

export const createStore = createAsyncThunk(
    "store/createStore",
    async (data, { rejectWithValue }) => {
        try {
            const response = await storeService.createStore(data);
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to create store"));
        }
    },
);

export const updateStore = createAsyncThunk(
    "store/updateStore",
    async ({ storeId, data }, { rejectWithValue }) => {
        try {
            const response = await storeService.updateStore(storeId, data);
            return response.data?.data || response.data;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to update store"));
        }
    },
);

export const deleteStore = createAsyncThunk(
    "store/deleteStore",
    async (storeId, { rejectWithValue }) => {
        try {
            await storeService.deleteStore(storeId);
            return storeId;
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to delete store"));
        }
    },
);

export const fetchStoreManagers = createAsyncThunk(
    "store/fetchStoreManagers",
    async (storeId, { rejectWithValue }) => {
        try {
            const response = await storeService.getStoreManagers(storeId);
            return { storeId, managers: response.data?.data?.managers || [] };
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to fetch managers"));
        }
    },
);

export const createStoreManager = createAsyncThunk(
    "store/createStoreManager",
    async ({ storeId, data }, { rejectWithValue }) => {
        try {
            const response = await storeService.createStoreManager(storeId, data);
            return { storeId, ...(response.data?.data || response.data) };
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to create manager"));
        }
    },
);

export const updateStoreManager = createAsyncThunk(
    "store/updateStoreManager",
    async ({ storeId, managerId, isActive }, { rejectWithValue }) => {
        try {
            const response = await storeService.updateStoreManager(storeId, managerId, isActive);
            return { storeId, managerId, ...response.data?.data };
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to update manager"));
        }
    },
);

export const deleteStoreManager = createAsyncThunk(
    "store/deleteStoreManager",
    async ({ storeId, managerId }, { rejectWithValue }) => {
        try {
            await storeService.deleteStoreManager(storeId, managerId);
            return { storeId, managerId };
        } catch (error) {
            return rejectWithValue(errorMessage(error, "Failed to remove manager"));
        }
    },
);
