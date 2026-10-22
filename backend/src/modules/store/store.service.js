import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../constants/roles.js';
import User from '../user/user.model.js';
import { getApprovedOrganizationForOwner } from '../organization/organization.service.js';
import { StoreModel } from './store.model.js';

const populateManager = (query) => query.populate('managerId', 'fullName username role');

const getOwnedStoreQuery = (storeId, storeAdminId) => ({
  _id: storeId,
  createdBy: storeAdminId,
});

const ensureUniqueCode = async (code, excludedStoreId) => {
  const query = { code };
  if (excludedStoreId) query._id = { $ne: excludedStoreId };
  if (await StoreModel.exists(query)) {
    throw new ApiError(409, 'A store with this code already exists');
  }
};

const ensureManagerExists = async (managerId) => {
  if (!managerId) return;
  const manager = await User.findOne({
    _id: managerId,
    role: ROLES.MANAGER,
    isActive: true,
    isBlocked: false,
    isApproved: true,
  }).select('_id');
  if (!manager) {
    throw new ApiError(400, 'The selected manager does not exist or is not active');
  }
};

const pickStoreFields = (storeData, fields) =>
  Object.fromEntries(
    fields
      .filter((field) => Object.hasOwn(storeData, field))
      .map((field) => [field, storeData[field]]),
  );

export const listStores = async (storeAdminId) =>
  populateManager(StoreModel.find({ createdBy: storeAdminId }).sort({ createdAt: -1 }));

export const getStore = async (storeId, storeAdminId) => {
  const store = await populateManager(
    StoreModel.findOne(getOwnedStoreQuery(storeId, storeAdminId)),
  );
  if (!store) throw new ApiError(404, 'Store was not found');
  return store;
};

export const createStore = async (storeData, storeAdminId) => {
  const organization = await getApprovedOrganizationForOwner(storeAdminId);
  await ensureUniqueCode(storeData.code);
  const store = await StoreModel.create({
    ...pickStoreFields(storeData, ['name', 'code', 'address', 'location', 'status']),
    organizationId: organization._id,
    managerId: storeAdminId,
    createdBy: storeAdminId,
  });
  return populateManager(StoreModel.findById(store._id));
};

export const updateStore = async (storeId, storeData, storeAdminId) => {
  const update = pickStoreFields(storeData, ['name', 'code', 'managerId', 'status']);
  for (const section of ['address', 'location']) {
    if (storeData[section] && typeof storeData[section] === 'object') {
      for (const [field, value] of Object.entries(storeData[section])) {
        update[`${section}.${field}`] = value;
      }
    }
  }
  const currentStore = await StoreModel.findOne(getOwnedStoreQuery(storeId, storeAdminId)).select(
    '_id',
  );
  if (!currentStore) throw new ApiError(404, 'Store was not found');

  if (update.code) await ensureUniqueCode(update.code, storeId);
  if (Object.hasOwn(update, 'managerId')) {
    await ensureManagerExists(update.managerId);
  }

  const store = await populateManager(
    StoreModel.findOneAndUpdate(
      getOwnedStoreQuery(storeId, storeAdminId),
      { $set: update },
      { new: true, runValidators: true },
    ),
  );
  if (!store) throw new ApiError(404, 'Store was not found');
  return store;
};

export const deleteStore = async (storeId, storeAdminId) => {
  const store = await StoreModel.findOneAndDelete(getOwnedStoreQuery(storeId, storeAdminId));
  if (!store) throw new ApiError(404, 'Store was not found');
};
