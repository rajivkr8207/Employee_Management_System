import { createSlice } from "@reduxjs/toolkit";
import { loginThunk, registerThunk, fetchProfileThunk, updateProfileThunk, logoutThunk } from "./auth.thunk";

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isInitializing: true,

    /* per-action status */
    loginStatus:         "idle",   // idle | loading | succeeded | failed
    registerStatus:      "idle",
    profileStatus:       "idle",
    updateProfileStatus: "idle",

    loginError:         null,
    registerError:      null,
    profileError:       null,
    updateProfileError: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAccessToken(state, { payload }) {
            state.token = payload;
        },
        clearAuth(state) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isInitializing = false;
        },
        clearErrors(state) {
            state.loginError         = null;
            state.registerError      = null;
            state.profileError       = null;
            state.updateProfileError = null;
        },
    },
    extraReducers: (builder) => {
        /* ── Login ── */
        builder
            .addCase(loginThunk.pending, (state) => {
                state.loginStatus = "loading";
                state.loginError  = null;
            })
            .addCase(loginThunk.fulfilled, (state, { payload }) => {
                state.loginStatus     = "succeeded";
                const user = payload?.user || (payload?._id ? payload : null);
                const token = payload?.accessToken || payload?.token;
                state.user            = user;
                state.token           = token || state.token;
                state.isAuthenticated = !!(user || token || state.token);
                if (user) state.profileStatus = "succeeded";
                state.isInitializing = false;
            })
            .addCase(loginThunk.rejected, (state, { payload }) => {
                state.loginStatus = "failed";
                state.loginError  = payload;
            });

        /* ── Register ── */
        builder
            .addCase(registerThunk.pending, (state) => {
                state.registerStatus = "loading";
                state.registerError  = null;
            })
            .addCase(registerThunk.fulfilled, (state, { payload }) => {
                state.registerStatus  = "succeeded";
                const user = payload?.user || (payload?._id ? payload : null);
                const token = payload?.accessToken || payload?.token;
                state.user            = user;
                if (token) {
                    state.token = token;
                    state.isAuthenticated = true;
                }
                state.isInitializing = false;
            })
            .addCase(registerThunk.rejected, (state, { payload }) => {
                state.registerStatus = "failed";
                state.registerError  = payload;
            });

        /* ── Fetch Profile ── */
        builder
            .addCase(fetchProfileThunk.pending, (state) => {
                state.profileStatus = "loading";
                state.profileError  = null;
            })
            .addCase(fetchProfileThunk.fulfilled, (state, { payload }) => {
                state.profileStatus = "succeeded";
                const user = payload?.user || payload;
                if (user && typeof user === "object") {
                    state.user = user;
                    state.isAuthenticated = true;
                }
                state.isInitializing = false;
            })
            .addCase(fetchProfileThunk.rejected, (state, { payload }) => {
                state.profileStatus = "failed";
                state.profileError  = payload;
                state.isInitializing = false;
            });

        /* ── Update Profile ── */
        builder
            .addCase(updateProfileThunk.pending, (state) => {
                state.updateProfileStatus = "loading";
                state.updateProfileError  = null;
            })
            .addCase(updateProfileThunk.fulfilled, (state, { payload }) => {
                state.updateProfileStatus = "succeeded";
                const user = payload?.user || payload;
                if (user && typeof user === "object") {
                    state.user = user;
                }
            })
            .addCase(updateProfileThunk.rejected, (state, { payload }) => {
                state.updateProfileStatus = "failed";
                state.updateProfileError  = payload;
            });

        /* ── Logout ── */
        builder
            .addCase(logoutThunk.fulfilled, (state) => {
                state.user            = null;
                state.token           = null;
                state.isAuthenticated = false;
                state.loginStatus     = "idle";
                state.registerStatus  = "idle";
                state.isInitializing = false;
            });
    },
});

export const { setAccessToken, clearAuth, clearErrors } = authSlice.actions;
export default authSlice.reducer;
