import { createSlice } from "@reduxjs/toolkit";
import {
    fetchDashboardStatsThunk,
    fetchRecentActivityThunk,
    fetchDeptStatsThunk,
} from "./dashboard.thunk";

const initialState = {
    stats: {
        totalEmployees:    0,
        presentToday:      0,
        absentToday:       0,
        onLeave:           0,
        pendingApprovals:  0,
        newHires:          0,
    },
    recentActivity: [],
    deptStats:      [],

    statsStatus:    "idle",   // idle | loading | succeeded | failed
    activityStatus: "idle",
    deptStatus:     "idle",

    statsError:    null,
    activityError: null,
    deptError:     null,
};

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        /* Stats */
        builder
            .addCase(fetchDashboardStatsThunk.pending, (state) => {
                state.statsStatus = "loading";
                state.statsError  = null;
            })
            .addCase(fetchDashboardStatsThunk.fulfilled, (state, { payload }) => {
                state.statsStatus = "succeeded";
                state.stats       = payload;
            })
            .addCase(fetchDashboardStatsThunk.rejected, (state, { payload }) => {
                state.statsStatus = "failed";
                state.statsError  = payload;
            });

        /* Recent activity */
        builder
            .addCase(fetchRecentActivityThunk.pending, (state) => {
                state.activityStatus = "loading";
                state.activityError  = null;
            })
            .addCase(fetchRecentActivityThunk.fulfilled, (state, { payload }) => {
                state.activityStatus = "succeeded";
                state.recentActivity = payload;
            })
            .addCase(fetchRecentActivityThunk.rejected, (state, { payload }) => {
                state.activityStatus = "failed";
                state.activityError  = payload;
            });

        /* Department stats */
        builder
            .addCase(fetchDeptStatsThunk.pending, (state) => {
                state.deptStatus = "loading";
                state.deptError  = null;
            })
            .addCase(fetchDeptStatsThunk.fulfilled, (state, { payload }) => {
                state.deptStatus = "succeeded";
                state.deptStats  = payload;
            })
            .addCase(fetchDeptStatsThunk.rejected, (state, { payload }) => {
                state.deptStatus = "failed";
                state.deptError  = payload;
            });
    },
});

export default dashboardSlice.reducer;

