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
} from './store.controller.js';
import {
  createStoreValidation,
  storeIdParamValidation,
  updateStoreValidation,
  createStoreManagerValidation,
} from './store.validate.js';

const storeRouter = Router();

storeRouter.use(verifyJWT, verifyStoreAdmin);
storeRouter.route('/').get(getStores).post(createStoreValidation, createStoreForAdmin);
storeRouter
  .route('/:storeId')
  .get(storeIdParamValidation, getStoreById)
  .patch(updateStoreValidation, updateStoreForAdmin)
  .delete(storeIdParamValidation, deleteStoreForAdmin);

// Store Admin creates/manages managers for own store
storeRouter
  .route('/:storeId/managers')
  .get(storeIdParamValidation, getManagersForStore)
  .post(createStoreManagerValidation, createManagerForStore);

export default storeRouter;
