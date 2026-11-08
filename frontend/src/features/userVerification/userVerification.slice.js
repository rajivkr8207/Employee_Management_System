import { createSlice } from "@reduxjs/toolkit";
import {
    fetchUsersThunk,
    rejectUserThunk,
    verifyUserThunk,
} from "./userVerification.thunk";

const initialState = {
    users: [],
    selectedUser: null,
    activeTab: "all",
    loading: false,
    actionLoading: false,
    error: null,
};

const userVerificationSlice = createSlice({
    name: "userVerification",
    initialState,
    reducers: {
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
        setSelectedUser: (state, action) => {
            state.selectedUser = action.payload;
        },
        clearSelectedUser: (state) => {
            state.selectedUser = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsersThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsersThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchUsersThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(verifyUserThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(verifyUserThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.users = state.users.map((user) => (user.id === updated.id ? updated : user));
                if (state.selectedUser?.id === updated.id) state.selectedUser = updated;
            })
            .addCase(verifyUserThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            .addCase(rejectUserThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(rejectUserThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.users = state.users.map((user) => (user.id === updated.id ? updated : user));
                if (state.selectedUser?.id === updated.id) state.selectedUser = updated;
            })
            .addCase(rejectUserThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            .addCase("auth/clearAuth", () => initialState)
            .addCase("auth/logout/fulfilled", () => initialState);
    },
});

export const { setActiveTab, setSelectedUser, clearSelectedUser } = userVerificationSlice.actions;
export default userVerificationSlice.reducer;
