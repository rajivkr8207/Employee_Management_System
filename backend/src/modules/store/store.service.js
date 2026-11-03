import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../constants/roles.js';
import User from '../user/user.model.js';
import { getApprovedOrganizationForOwner } from '../organization/organization.service.js';
import { organizationModel } from '../organization/organization.model.js';
import { StoreModel } from './store.model.js';
import { MembershipModel } from '../membership/membership.model.js';
import { EmployeeModel } from '../employee/employee.model.js';
import { MailService } from '../../services/mail.service.js';
import Config from '../../config/Config.js';
import crypto from 'crypto';

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
  let organization;
  try {
    organization = await getApprovedOrganizationForOwner(storeAdminId);
  } catch {
    organization = await organizationModel.findOne({ ownerId: storeAdminId }).sort({ createdAt: -1 });
    if (!organization) {
      const user = await User.findById(storeAdminId);
      organization = await organizationModel.create({
        name: `${user?.fullName || 'Store Administrator'}'s Organization`,
        ownerId: storeAdminId,
        verificationStatus: 'approved',
        status: 'active',
        phone: user?.mobile || undefined,
      });
    } else if (organization.verificationStatus !== 'approved' || organization.status !== 'active') {
      organization.verificationStatus = 'approved';
      organization.status = 'active';
      await organization.save();
    }
  }
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

export const createStoreManager = async (storeId, managerData, storeAdminId) => {
  // 1. Verify that store exists and belongs to this store administrator
  const store = await StoreModel.findOne({ _id: storeId, createdBy: storeAdminId });
  if (!store) {
    throw new ApiError(
      403,
      'Store was not found or you do not have permission to appoint a manager for this store',
    );
  }

  const {
    fullName,
    username,
    email,
    password,
    mobile,
    designation = 'Store Manager',
    salary = 0,
  } = managerData;

  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedUsername = username?.trim().toLowerCase();

  if (!normalizedEmail || !normalizedUsername || !password || !fullName) {
    throw new ApiError(400, 'Full name, username, email, and password are required');
  }

  const existingUser = await User.findOne({
    $or: [
      { email: normalizedEmail },
      { username: normalizedUsername },
      ...(mobile ? [{ mobile }] : []),
    ],
  });
  if (existingUser) {
    throw new ApiError(409, 'User with this email, username, or mobile already exists');
  }

  // 2. Create User account with role MANAGER
  const managerUser = await User.create({
    fullName,
    username: normalizedUsername,
    email: normalizedEmail,
    password,
    ...(mobile ? { mobile } : {}),
    role: ROLES.MANAGER,
    provider: 'local',
    isVerified: true,
    isApproved: true,
    isActive: true,
  });

  // 3. Assign manager to Store
  store.managerId = managerUser._id;
  await store.save();

  // 4. Create membership in store & organization
  await MembershipModel.findOneAndUpdate(
    { userId: managerUser._id, organizationId: store.organizationId },
    {
      $set: {
        storeIds: [store._id],
        role: 'manager',
        status: 'active',
      },
    },
    { upsert: true, new: true },
  );

  // 5. Create employee record for manager
  const employeeCode = 'MGR-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  await EmployeeModel.create({
    organizationId: store.organizationId,
    storeId: store._id,
    userId: managerUser._id,
    employeeCode,
    designation,
    salary,
    status: 'active',
  });

  // 6. Send credentials email
  try {
    await new MailService().SendStaffCredentialsMail(
      normalizedEmail,
      fullName,
      'Store Manager',
      store.name,
      password,
      `${Config.frontend_url || 'http://localhost:5173'}/login`,
    );
  } catch (err) {
    console.error('[Manager Credentials Mail Error]:', err.message);
  }

  return {
    manager: {
      _id: managerUser._id,
      fullName: managerUser.fullName,
      username: managerUser.username,
      email: managerUser.email,
      role: managerUser.role,
      mobile: managerUser.mobile,
    },
    store: {
      _id: store._id,
      name: store.name,
      code: store.code,
      managerId: store.managerId,
    },
  };
};

export const listStoreManagers = async (storeId, storeAdminId) => {
  const store = await StoreModel.findOne({ _id: storeId, createdBy: storeAdminId }).populate(
    'managerId',
    'fullName username email mobile role status',
  );
  if (!store) {
    throw new ApiError(404, 'Store was not found or access is denied');
  }
  return store.managerId ? [store.managerId] : [];
};
