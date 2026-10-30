import { createSlice } from "@reduxjs/toolkit";
import { loginThunk, registerThunk, fetchProfileThunk, updateProfileThunk, logoutThunk } from "./auth.thunk";

/* ── helper: parse token expiry ── */
function getStoredUser() {
    try {
        const raw = localStorage.getItem("ems_user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

const storedUser  = getStoredUser();
const storedToken = localStorage.getItem("ems_token");

const initialState = {
    user:            storedUser,
    token:           storedToken,
    isAuthenticated: !!storedToken,

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
        /* Manual logout without a thunk */
        clearAuth(state) {
            state.user            = null;
            state.token           = null;
            state.isAuthenticated = false;
            localStorage.removeItem("ems_token");
            localStorage.removeItem("ems_user");
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
                state.loginStatus    = "succeeded";
                state.user           = payload.user;
                state.token          = payload.token;
                state.isAuthenticated = true;
                localStorage.setItem("ems_token", payload.token);
                localStorage.setItem("ems_user",  JSON.stringify(payload.user));
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
                state.user            = payload.user;
                state.token           = payload.token;
                state.isAuthenticated = true;
                localStorage.setItem("ems_token", payload.token);
                localStorage.setItem("ems_user",  JSON.stringify(payload.user));
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
                state.user          = payload;
                localStorage.setItem("ems_user", JSON.stringify(payload));
            })
            .addCase(fetchProfileThunk.rejected, (state, { payload }) => {
                state.profileStatus = "failed";
                state.profileError  = payload;
            });

        /* ── Update Profile ── */
        builder
            .addCase(updateProfileThunk.pending, (state) => {
                state.updateProfileStatus = "loading";
                state.updateProfileError  = null;
            })
            .addCase(updateProfileThunk.fulfilled, (state, { payload }) => {
                state.updateProfileStatus = "succeeded";
                state.user                = payload;
                localStorage.setItem("ems_user", JSON.stringify(payload));
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
                localStorage.removeItem("ems_token");
                localStorage.removeItem("ems_user");
            });
    },
});

export const { clearAuth, clearErrors } = authSlice.actions;
export default authSlice.reducer;

