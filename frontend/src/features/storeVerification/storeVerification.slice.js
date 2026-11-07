import { createSlice } from "@reduxjs/toolkit";
import {
    approveStoreThunk,
    fetchStoresThunk,
    rejectStoreThunk,
} from "./storeVerification.thunk";

const initialState = {
    stores: [],
    selectedStore: null,
    activeTab: "all",
    loading: false,
    actionLoading: false,
    error: null,
};

const storeVerificationSlice = createSlice({
    name: "storeVerification",
    initialState,
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
        setSelectedStore: (state, action) => {
            state.selectedStore = action.payload;
        },
        clearSelectedStore: (state) => {
            state.selectedStore = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStoresThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStoresThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.stores = action.payload;
            })
            .addCase(fetchStoresThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(approveStoreThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(approveStoreThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.stores = state.stores.map((store) => (store.id === updated.id ? updated : store));
                if (state.selectedStore?.id === updated.id) state.selectedStore = updated;
            })
            .addCase(approveStoreThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            .addCase(rejectStoreThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(rejectStoreThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.stores = state.stores.map((store) => (store.id === updated.id ? updated : store));
                if (state.selectedStore?.id === updated.id) state.selectedStore = updated;
            })
            .addCase(rejectStoreThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            .addCase("auth/clearAuth", () => initialState)
            .addCase("auth/logout/fulfilled", () => initialState);
    },
});

export const { setActiveTab, setSelectedStore, clearSelectedStore } = storeVerificationSlice.actions;
export default storeVerificationSlice.reducer;
