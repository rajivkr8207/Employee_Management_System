import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createStore,
  deleteStore,
  getStore,
  listStores,
  updateStore,
  createStoreManager,
  listStoreManagers,
} from './store.service.js';

export const getStores = asyncHandler(async (req, res) => {
  const stores = await listStores(req.user.id);
  return res.status(200).json(new ApiResponse(200, { stores }, 'Stores fetched successfully'));
});

export const getStoreById = asyncHandler(async (req, res) => {
  const store = await getStore(req.params.storeId, req.user.id);
  return res.status(200).json(new ApiResponse(200, { store }, 'Store fetched successfully'));
});

export const createStoreForAdmin = asyncHandler(async (req, res) => {
  const store = await createStore(req.body, req.user.id);
  return res.status(201).json(new ApiResponse(201, { store }, 'Store created successfully'));
});

export const updateStoreForAdmin = asyncHandler(async (req, res) => {
  const store = await updateStore(req.params.storeId, req.body, req.user.id);
  return res.status(200).json(new ApiResponse(200, { store }, 'Store updated successfully'));
});

export const deleteStoreForAdmin = asyncHandler(async (req, res) => {
  await deleteStore(req.params.storeId, req.user.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Store deleted successfully'));
});

export const createManagerForStore = asyncHandler(async (req, res) => {
  const result = await createStoreManager(req.params.storeId, req.body, req.user.id);
  return res
    .status(201)
    .json(new ApiResponse(201, result, 'Store manager created and assigned successfully'));
});

export const getManagersForStore = asyncHandler(async (req, res) => {
  const managers = await listStoreManagers(req.params.storeId, req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { managers }, 'Store managers fetched successfully'));
});
