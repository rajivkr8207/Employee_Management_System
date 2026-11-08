import { createSlice } from "@reduxjs/toolkit";
import {
    createOrganization,
    fetchMyOrganization,
    updateMyOrganization,
} from "./organization.thunk";

const initialState = {
    organization: null,
    loading: false,
    creating: false,
    error: null,
};

const organizationSlice = createSlice({
    name: "organization",
    initialState,
    reducers: {
        clearOrgError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyOrganization.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyOrganization.fulfilled, (state, action) => {
                state.loading = false;
                state.organization = action.payload?.organization || action.payload;
            })
            .addCase(fetchMyOrganization.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createOrganization.pending, (state) => {
                state.creating = true;
            })
            .addCase(createOrganization.fulfilled, (state, action) => {
                state.creating = false;
                state.organization = action.payload?.organization || action.payload;
            })
            .addCase(createOrganization.rejected, (state, action) => {
                state.creating = false;
                state.error = action.payload;
            })
            .addCase(updateMyOrganization.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateMyOrganization.fulfilled, (state, action) => {
                state.loading = false;
                state.organization = action.payload?.organization || action.payload;
            })
            .addCase(updateMyOrganization.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase("auth/clearAuth", () => initialState)
            .addCase("auth/logout/fulfilled", () => initialState);
    },
});

export const { clearOrgError } = organizationSlice.actions;
export default organizationSlice.reducer;
