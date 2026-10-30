import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../lib/api";

/* ── helper: extract readable error message ── */
function extractError(error) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Something went wrong"
    );
}

/* ── Login ── */
export const loginThunk = createAsyncThunk(
    "auth/login",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });
            // Expected: { token, user: { id, name, email, role, avatar, ... } }
            return data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    }
);

/* ── Register ── */
export const registerThunk = createAsyncThunk(
    "auth/register",
    async ({ fullName, email, password, role, mobile, username }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/register", { fullName, email, password, role, mobile, username });
            return data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    }
);

/* ── Fetch current user profile ── */
export const fetchProfileThunk = createAsyncThunk(
    "auth/fetchProfile",
    async (_, { rejectWithValue, getState }) => {
        try {
            const token = getState().auth.token;
            const { data } = await api.get("/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    }
);

/* ── Update profile ── */
export const updateProfileThunk = createAsyncThunk(
    "auth/updateProfile",
    async (formData, { rejectWithValue, getState }) => {
        try {
            const token = getState().auth.token;
            const { data } = await api.put("/auth/me", formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    }
);

/* ── Logout (calls API to invalidate token if needed) ── */
export const logoutThunk = createAsyncThunk(
    "auth/logout",
    async (_, { getState }) => {
        try {
            const token = getState().auth.token;
            await api.post("/auth/logout", {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // Fail silently — clear local state regardless
        }
    }
);

