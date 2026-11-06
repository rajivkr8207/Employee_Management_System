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
  },
  {
    condition: (options, { getState }) => {
      const { loading, storesLoaded } = getState().store;
      return !loading && (options?.force || !storesLoaded);
    },
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
      return { storeId, managers: res.data?.data?.managers || [] };
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
      return { storeId, ...(res.data?.data || res.data) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create manager");
    }
  }
);

export const updateStoreManager = createAsyncThunk(
  "store/updateStoreManager",
  async ({ storeId, managerId, isActive }, { rejectWithValue }) => {
    try {
      const res = await storeService.updateStoreManager(storeId, managerId, isActive);
      return { storeId, managerId, ...res.data?.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update manager");
    }
  }
);

export const deleteStoreManager = createAsyncThunk(
  "store/deleteStoreManager",
  async ({ storeId, managerId }, { rejectWithValue }) => {
    try {
      await storeService.deleteStoreManager(storeId, managerId);
      return { storeId, managerId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to remove manager");
    }
  }
);

const storeSlice = createSlice({
  name: "store",
  initialState: {
    stores: [],
    managers: {},
    loading: false,
    managerLoading: false,
    storesLoaded: false,
    error: null,
    creating: false,
    managerCreating: false,
    managerError: null,
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
        state.storesLoaded = true;
        state.stores = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.stores || [];
      })
      .addCase(fetchMyStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase("auth/clearAuth", (state) => {
        state.stores = [];
        state.managers = {};
        state.storesLoaded = false;
        state.error = null;
        state.managerError = null;
        state.managerLoading = false;
        state.managerCreating = false;
      })
      .addCase("auth/logout/fulfilled", (state) => {
        state.stores = [];
        state.managers = {};
        state.storesLoaded = false;
        state.error = null;
        state.managerError = null;
        state.managerLoading = false;
        state.managerCreating = false;
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
        state.managerLoading = false;
        state.managers[action.payload.storeId] = action.payload.managers;
        state.managerError = null;
      })
      .addCase(fetchStoreManagers.pending, (state) => {
        state.managerLoading = true;
        state.managerError = null;
      })
      .addCase(fetchStoreManagers.rejected, (state, action) => {
        state.managerLoading = false;
        state.managerError = action.payload;
      })
      .addCase(createStoreManager.pending, (state) => {
        state.managerCreating = true;
        state.managerError = null;
      })
      .addCase(createStoreManager.fulfilled, (state, action) => {
        state.managerCreating = false;
        state.managerError = null;
        const { storeId, manager } = action.payload;
        if (manager) {
          const currentManagers = state.managers[storeId] || [];
          if (!currentManagers.some((item) => item._id === manager._id)) {
            state.managers[storeId] = [
              ...currentManagers,
              {
                ...manager,
                isActive: true,
                membershipStatus: "active",
                status: "active",
              },
            ];
          }
        }
      })
      .addCase(createStoreManager.rejected, (state, action) => {
        state.managerCreating = false;
        state.managerError = action.payload;
      })
      .addCase(updateStoreManager.fulfilled, (state, action) => {
        const { storeId, managerId, isActive, status } = action.payload;
        state.managers[storeId] = (state.managers[storeId] || []).map((manager) =>
          manager._id === managerId
            ? {
                ...manager,
                isActive,
                membershipStatus: status,
                status: isActive ? "active" : "inactive",
              }
            : manager
        );
        state.managerError = null;
      })
      .addCase(updateStoreManager.rejected, (state, action) => {
        state.managerError = action.payload;
      })
      .addCase(deleteStoreManager.fulfilled, (state, action) => {
        const { storeId, managerId } = action.payload;
        state.managers[storeId] = (state.managers[storeId] || []).filter(
          (manager) => manager._id !== managerId
        );
        state.managerError = null;
      })
      .addCase(deleteStoreManager.rejected, (state, action) => {
        state.managerError = action.payload;
      });
  },
});

export const { clearStoreError } = storeSlice.actions;
export default storeSlice.reducer;
