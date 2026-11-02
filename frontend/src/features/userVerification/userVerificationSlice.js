import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userVerificationService } from "./services/userVerificationService";

export const fetchUsersThunk = createAsyncThunk(
    "userVerification/fetchUsers",
    async (tab = "all", { rejectWithValue }) => {
        try {
            return await userVerificationService.getUsers(tab);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to fetch users");
        }
    }
);

export const verifyUserThunk = createAsyncThunk(
    "userVerification/verifyUser",
    async (userId, { rejectWithValue }) => {
        try {
            return await userVerificationService.verifyUser(userId);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to verify user");
        }
    }
);

export const rejectUserThunk = createAsyncThunk(
    "userVerification/rejectUser",
    async ({ userId, reason }, { rejectWithValue }) => {
        try {
            return await userVerificationService.rejectUser(userId, reason);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to reject user");
        }
    }
);

export const requestUserInfoThunk = createAsyncThunk(
    "userVerification/requestInfo",
    async ({ userId, notes }, { rejectWithValue }) => {
        try {
            return await userVerificationService.requestAdditionalInfo(userId, notes);
        } catch (err) {
            return rejectWithValue(err.message || "Failed to request additional information");
        }
    }
);

const userVerificationSlice = createSlice({
    name: "userVerification",
    initialState: {
        users: [],
        selectedUser: null,
        activeTab: "all", // all | pending | verified | rejected
        loading: false,
        actionLoading: false,
        error: null,
    },
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
            // Fetch users
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
            // Verify
            .addCase(verifyUserThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(verifyUserThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.users = state.users.map((u) => (u.id === updated.id ? updated : u));
                if (state.selectedUser?.id === updated.id) {
                    state.selectedUser = updated;
                }
            })
            .addCase(verifyUserThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            // Reject
            .addCase(rejectUserThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(rejectUserThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.users = state.users.map((u) => (u.id === updated.id ? updated : u));
                if (state.selectedUser?.id === updated.id) {
                    state.selectedUser = updated;
                }
            })
            .addCase(rejectUserThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })
            // Request info
            .addCase(requestUserInfoThunk.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(requestUserInfoThunk.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload;
                state.users = state.users.map((u) => (u.id === updated.id ? updated : u));
                if (state.selectedUser?.id === updated.id) {
                    state.selectedUser = updated;
                }
            })
            .addCase(requestUserInfoThunk.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            });
    },
});

export const { setActiveTab, setSelectedUser, clearSelectedUser } = userVerificationSlice.actions;
export default userVerificationSlice.reducer;

