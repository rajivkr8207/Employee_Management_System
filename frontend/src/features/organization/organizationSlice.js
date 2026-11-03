import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { organizationService } from "./services/organizationService";

export const fetchMyOrganization = createAsyncThunk(
  "organization/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await organizationService.getMyOrganization();
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch organization");
    }
  }
);

export const createOrganization = createAsyncThunk(
  "organization/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await organizationService.createOrganization(data);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create organization");
    }
  }
);

export const updateMyOrganization = createAsyncThunk(
  "organization/update",
  async (data, { rejectWithValue }) => {
    try {
      const res = await organizationService.updateMyOrganization(data);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update organization");
    }
  }
);

const organizationSlice = createSlice({
  name: "organization",
  initialState: {
    organization: null,
    loading: false,
    creating: false,
    error: null,
  },
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
      });
  },
});

export const { clearOrgError } = organizationSlice.actions;
export default organizationSlice.reducer;
