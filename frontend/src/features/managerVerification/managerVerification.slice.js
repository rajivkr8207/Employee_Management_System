import { createSlice } from "@reduxjs/toolkit";
import {
    approveManagerThunk,
    fetchManagersThunk,
    rejectManagerThunk,
} from "./managerVerification.thunk";

const initialState = {
    managers: [],
    activeTab: "all",
    loading: false,
    actionLoading: false,
    error: null,
};

const managerVerificationSlice = createSlice({
    name: "managerVerification",
    initialState,
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchManagersThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchManagersThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.managers = action.payload;
            })
            .addCase(fetchManagersThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(approveManagerThunk.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(approveManagerThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.managers = state.managers.map((manager) =>
                    manager.id === action.payload.id ? action.payload : manager,
                );
            })
            .addCase(approveManagerThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            .addCase(rejectManagerThunk.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(rejectManagerThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.managers = state.managers.map((manager) =>
                    manager.id === action.payload.id ? action.payload : manager,
                );
            })
            .addCase(rejectManagerThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            .addCase("auth/clearAuth", () => initialState)
            .addCase("auth/logout/fulfilled", () => initialState);
    },
});

export const { setActiveTab } = managerVerificationSlice.actions;
export default managerVerificationSlice.reducer;
