import { createSlice } from "@reduxjs/toolkit";
import {
    applyForLeave,
    cancelLeave,
    fetchManagedLeaves,
    fetchMyLeaves,
    reviewLeave,
} from "./leave.thunk";

const initialState = {
    leaves: [],
    loading: false,
    saving: false,
    error: null,
};

const leaveSlice = createSlice({
    name: "leave",
    initialState,
    reducers: {
        clearLeaveError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyLeaves.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyLeaves.fulfilled, (state, action) => {
                state.loading = false;
                state.leaves = action.payload;
            })
            .addCase(fetchMyLeaves.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchManagedLeaves.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchManagedLeaves.fulfilled, (state, action) => {
                state.loading = false;
                state.leaves = action.payload;
            })
            .addCase(fetchManagedLeaves.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(applyForLeave.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(applyForLeave.fulfilled, (state, action) => {
                state.saving = false;
                if (action.payload) state.leaves.unshift(action.payload);
            })
            .addCase(applyForLeave.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload;
            })
            .addCase(reviewLeave.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(reviewLeave.fulfilled, (state, action) => {
                state.saving = false;
                state.leaves = state.leaves.map((leave) =>
                    leave._id === action.payload?._id ? action.payload : leave,
                );
            })
            .addCase(reviewLeave.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload;
            })
            .addCase(cancelLeave.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(cancelLeave.fulfilled, (state, action) => {
                state.saving = false;
                state.leaves = state.leaves.filter((leave) => leave._id !== action.payload);
            })
            .addCase(cancelLeave.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload;
            })
            .addCase("auth/clearAuth", () => initialState)
            .addCase("auth/logout/fulfilled", () => initialState);
    },
});

export const { clearLeaveError } = leaveSlice.actions;
export default leaveSlice.reducer;
