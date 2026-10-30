import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../lib/api";

function extractError(err) {
    return (
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        err?.message                  ||
        "Something went wrong"
    );
}

/* ── Fetch dashboard stats ── */
export const fetchDashboardStatsThunk = createAsyncThunk(
    "dashboard/fetchStats",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/dashboard/stats");
            return data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    }
);

/* ── Fetch recent activity ── */
export const fetchRecentActivityThunk = createAsyncThunk(
    "dashboard/fetchRecentActivity",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/dashboard/activity");
            return data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    }
);

/* ── Fetch department breakdown ── */
export const fetchDeptStatsThunk = createAsyncThunk(
    "dashboard/fetchDeptStats",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/dashboard/departments");
            return data;
        } catch (err) {
            return rejectWithValue(extractError(err));
        }
    }
);

