import { createSlice } from "@reduxjs/toolkit";
import {
    createStore,
    createStoreManager,
    deleteStore,
    deleteStoreManager,
    fetchMyStores,
    fetchStoreManagers,
    updateStore,
    updateStoreManager,
} from "./store.thunk";

const initialState = {
    stores: [],
    managers: {},
    loading: false,
    managerLoading: false,
    storesLoaded: false,
    error: null,
    creating: false,
    managerCreating: false,
    managerError: null,
};

const storeSlice = createSlice({
    name: "store",
    initialState,
    reducers: {
        clearStoreError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyStores.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyStores.fulfilled, (state, action) => {
                state.loading = false;
                state.storesLoaded = true;
                state.stores = Array.isArray(action.payload)
                    ? action.payload
                    : action.payload?.stores || [];
            })
            .addCase(fetchMyStores.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase("auth/clearAuth", () => initialState)
            .addCase("auth/logout/fulfilled", () => initialState)
            .addCase(createStore.pending, (state) => {
                state.creating = true;
            })
            .addCase(createStore.fulfilled, (state, action) => {
                state.creating = false;
                const store = action.payload?.store || action.payload;
                if (store) state.stores.unshift(store);
            })
            .addCase(createStore.rejected, (state, action) => {
                state.creating = false;
                state.error = action.payload;
            })
            .addCase(updateStore.fulfilled, (state, action) => {
                const updated = action.payload?.store || action.payload;
                if (updated?._id) {
                    const index = state.stores.findIndex((store) => store._id === updated._id);
                    if (index !== -1) state.stores[index] = updated;
                }
            })
            .addCase(deleteStore.fulfilled, (state, action) => {
                state.stores = state.stores.filter((store) => store._id !== action.payload);
            })
            .addCase(fetchStoreManagers.fulfilled, (state, action) => {
                state.managerLoading = false;
                state.managers[action.payload.storeId] = action.payload.managers;
                state.managerError = null;
            })
            .addCase(fetchStoreManagers.pending, (state) => {
                state.managerLoading = true;
                state.managerError = null;
            })
            .addCase(fetchStoreManagers.rejected, (state, action) => {
                state.managerLoading = false;
                state.managerError = action.payload;
            })
            .addCase(createStoreManager.pending, (state) => {
                state.managerCreating = true;
                state.managerError = null;
            })
            .addCase(createStoreManager.fulfilled, (state) => {
                state.managerCreating = false;
            })
            .addCase(createStoreManager.rejected, (state, action) => {
                state.managerCreating = false;
                state.managerError = action.payload;
            })
            .addCase(updateStoreManager.fulfilled, (state, action) => {
                const { storeId, managerId, isActive, status } = action.payload;
                state.managers[storeId] = (state.managers[storeId] || []).map((manager) =>
                    manager._id === managerId
                        ? { ...manager, isActive, membershipStatus: status, status: isActive ? "active" : "inactive" }
                        : manager,
                );
                state.managerError = null;
            })
            .addCase(updateStoreManager.rejected, (state, action) => {
                state.managerError = action.payload;
            })
            .addCase(deleteStoreManager.fulfilled, (state, action) => {
                const { storeId, managerId } = action.payload;
                state.managers[storeId] = (state.managers[storeId] || []).filter(
                    (manager) => manager._id !== managerId,
                );
                state.managerError = null;
            })
            .addCase(deleteStoreManager.rejected, (state, action) => {
                state.managerError = action.payload;
            });
    },
});

export const { clearStoreError } = storeSlice.actions;
export default storeSlice.reducer;
