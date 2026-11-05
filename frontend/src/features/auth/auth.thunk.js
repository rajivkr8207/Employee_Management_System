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
    async ({ identifier, password }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/login", { identifier, password });
            return data?.data || data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    }
);

/* ── Register ── */
export const registerThunk = createAsyncThunk(
    "auth/register",
    async (payload, { rejectWithValue }) => {
        try {
            const endpoint = payload.token ? "/auth/store-admin/register" : "/auth/register";
            const { data } = await api.post(endpoint, payload);
            return data?.data || data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    }
);

/* ── Fetch current user profile ── */
export const fetchProfileThunk = createAsyncThunk(
    "auth/fetchProfile",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/auth/profile");
            return data?.data || data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    },
    {
        condition: (options, { getState }) => {
            const { profileStatus } = getState().auth;
            return profileStatus !== "loading" &&
                (options?.force || profileStatus !== "succeeded");
        },
    }
);

/* ── Update profile ── */
export const updateProfileThunk = createAsyncThunk(
    "auth/updateProfile",
    async (formData, { rejectWithValue }) => {
        try {
            const payload = {
                ...(formData.fullName || formData.name ? { fullName: formData.fullName || formData.name } : {}),
                ...(formData.username ? { username: formData.username } : {}),
                ...(formData.mobile || formData.phone ? { mobile: formData.mobile || formData.phone } : {}),
            };
            const { data } = await api.patch("/auth/profile", payload);
            return data?.data || data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    }
);

/* ── Logout (calls API to invalidate token if needed) ── */
export const logoutThunk = createAsyncThunk(
    "auth/logout",
    async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // Fail silently — clear local state regardless
        }
    }
);
