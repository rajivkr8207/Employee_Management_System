import { Router } from 'express';
import { verifyJWT, verifyStoreAdmin } from '../../middlewares/auth.middleware.js';
import {
  createStoreForAdmin,
  deleteStoreForAdmin,
  getStoreById,
  getStores,
  updateStoreForAdmin,
} from './store.controller.js';
import {
  createStoreValidation,
  storeIdParamValidation,
  updateStoreValidation,
} from './store.validate.js';

const storeRouter = Router();

storeRouter.use(verifyJWT, verifyStoreAdmin);
storeRouter.route('/').get(getStores).post(createStoreValidation, createStoreForAdmin);
storeRouter
  .route('/:storeId')
  .get(storeIdParamValidation, getStoreById)
  .patch(updateStoreValidation, updateStoreForAdmin)
  .delete(storeIdParamValidation, deleteStoreForAdmin);

export default storeRouter;
