import { Router } from 'express';
import { verifyJWT, verifyStoreAdmin } from '../../middlewares/auth.middleware.js';
import {
  createStoreForAdmin,
  deleteStoreForAdmin,
  getStoreById,
  getStores,
  updateStoreForAdmin,
  createManagerForStore,
  getManagersForStore,
  updateManagerStatusForStore,
  removeManagerFromStore,
} from './store.controller.js';
import {
  createStoreValidation,
  storeIdParamValidation,
  updateStoreValidation,
  createStoreManagerValidation,
  storeManagerParamValidation,
  updateStoreManagerValidation,
} from './store.validate.js';

const storeRouter = Router();

storeRouter.use(verifyJWT);
storeRouter.get('/', getStores);
storeRouter.post('/', verifyStoreAdmin, createStoreValidation, createStoreForAdmin);
storeRouter
  .route('/:storeId')
  .get(verifyStoreAdmin, storeIdParamValidation, getStoreById)
  .patch(verifyStoreAdmin, updateStoreValidation, updateStoreForAdmin)
  .delete(verifyStoreAdmin, storeIdParamValidation, deleteStoreForAdmin);

// Store Admin creates/manages managers for own store
storeRouter
  .route('/:storeId/managers')
  .get(verifyStoreAdmin, storeIdParamValidation, getManagersForStore)
  .post(verifyStoreAdmin, createStoreManagerValidation, createManagerForStore);
storeRouter
  .route('/:storeId/managers/:managerId')
  .patch(verifyStoreAdmin, updateStoreManagerValidation, updateManagerStatusForStore)
  .delete(verifyStoreAdmin, storeManagerParamValidation, removeManagerFromStore);

export default storeRouter;
