import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { storeService } from "./services/storeService";

export const fetchMyStores = createAsyncThunk(
  "store/fetchMyStores",
  async (_, { rejectWithValue }) => {
    try {
      const res = await storeService.getMyStores();
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch stores");
    }
  }
);

export const createStore = createAsyncThunk(
  "store/createStore",
  async (data, { rejectWithValue }) => {
    try {
      const res = await storeService.createStore(data);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create store");
    }
  }
);

export const updateStore = createAsyncThunk(
  "store/updateStore",
  async ({ storeId, data }, { rejectWithValue }) => {
    try {
      const res = await storeService.updateStore(storeId, data);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update store");
    }
  }
);

export const deleteStore = createAsyncThunk(
  "store/deleteStore",
  async (storeId, { rejectWithValue }) => {
    try {
      await storeService.deleteStore(storeId);
      return storeId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete store");
    }
  }
);

export const fetchStoreManagers = createAsyncThunk(
  "store/fetchStoreManagers",
  async (storeId, { rejectWithValue }) => {
    try {
      const res = await storeService.getStoreManagers(storeId);
      return { storeId, managers: res.data?.data || [] };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch managers");
    }
  }
);

export const createStoreManager = createAsyncThunk(
  "store/createStoreManager",
  async ({ storeId, data }, { rejectWithValue }) => {
    try {
      const res = await storeService.createStoreManager(storeId, data);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create manager");
    }
  }
);

const storeSlice = createSlice({
  name: "store",
  initialState: {
    stores: [],
    managers: {},
    loading: false,
    error: null,
    creating: false,
  },
  reducers: {
    clearStoreError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyStores.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.stores || [];
      })
      .addCase(fetchMyStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createStore.pending, (state) => {
        state.creating = true;
      })
      .addCase(createStore.fulfilled, (state, action) => {
        state.creating = false;
        const s = action.payload?.store || action.payload;
        if (s) state.stores.unshift(s);
      })
      .addCase(createStore.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      .addCase(updateStore.fulfilled, (state, action) => {
        const updated = action.payload?.store || action.payload;
        if (updated?._id) {
          const idx = state.stores.findIndex((s) => s._id === updated._id);
          if (idx !== -1) state.stores[idx] = updated;
        }
      })
      .addCase(deleteStore.fulfilled, (state, action) => {
        state.stores = state.stores.filter((s) => s._id !== action.payload);
      })
      .addCase(fetchStoreManagers.fulfilled, (state, action) => {
        state.managers[action.payload.storeId] = action.payload.managers;
      });
  },
});

export const { clearStoreError } = storeSlice.actions;
export default storeSlice.reducer;
