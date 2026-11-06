import request from 'supertest';
import { jest } from '@jest/globals';
import { ROLES } from '../src/constants/roles.js';

jest.unstable_mockModule('../src/config/redis.js', () => ({
  default: {
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 1,
    on: () => {},
    quit: async () => 'OK',
  },
}));

jest.unstable_mockModule('../src/services/mail.service.js', () => ({
  MailService: class {
    async SendStaffCredentialsMail() {}
  },
}));

const { app } = await import('../src/app.js');
const { default: UserModel } = await import('../src/modules/user/user.model.js');
const { organizationModel } = await import('../src/modules/organization/organization.model.js');
const { StoreModel } = await import('../src/modules/store/store.model.js');
const { MembershipModel } = await import('../src/modules/membership/membership.model.js');
const { EmployeeModel } = await import('../src/modules/employee/employee.model.js');
const { connectTestDB, closeTestDB, clearTestDB } = await import('./setup.js');

const createUser = async ({ username, role = ROLES.STORE_ADMIN }) => {
  const user = await UserModel.create({
    fullName: 'Test Store Admin',
    username,
    email: `${username}@example.com`,
    password: 'Password123',
    role,
    isVerified: true,
  });
  return { user, token: user.generateAccessToken() };
};

const storeDetails = {
  name: 'Downtown Store',
  code: 'DOWNTOWN-01',
  address: {
    street: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
  },
  location: { lat: 19.076, lng: 72.8777, radius: 250 },
};

const createApprovedOrganization = async (ownerId, email) =>
  organizationModel.create({
    name: 'Approved Organization',
    email,
    ownerId,
    verificationStatus: 'approved',
  });

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Store API', () => {
  describe('POST /api/v1/stores', () => {
    it('requires an authenticated store administrator', async () => {
      const res = await request(app).post('/api/v1/stores').send(storeDetails);
      expect(res.statusCode).toBe(401);

      const { token } = await createUser({ username: 'employee', role: ROLES.EMPLOYEE });
      const forbidden = await request(app)
        .post('/api/v1/stores')
        .set('Cookie', `accessToken=${token}`)
        .send(storeDetails);
      expect(forbidden.statusCode).toBe(403);
    });

    it('creates a store under the administrator’s approved organization', async () => {
      const { user, token } = await createUser({ username: 'storeowner' });
      const organization = await createApprovedOrganization(user.id, 'approved@example.com');
      const res = await request(app)
        .post('/api/v1/stores')
        .set('Cookie', `accessToken=${token}`)
        .send(storeDetails);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.store.name).toBe(storeDetails.name);
      expect(res.body.data.store.code).toBe(storeDetails.code);
      expect(res.body.data.store.organizationId).toBe(organization.id);
      expect(res.body.data.store.createdBy).toBe(user.id);
      expect(res.body.data.store.status).toBe('inactive');
      expect(res.body.data.store.verificationStatus).toBe('pending');
      expect(await StoreModel.countDocuments({ createdBy: user.id })).toBe(1);

      const secondStore = await request(app)
        .post('/api/v1/stores')
        .set('Cookie', `accessToken=${token}`)
        .send({ ...storeDetails, code: 'DOWNTOWN-02' });
      expect(secondStore.statusCode).toBe(409);
    });

    it('rejects invalid store details and creation without an approved organization', async () => {
      const { user, token } = await createUser({ username: 'invalidstoreowner' });

      const noOrganization = await request(app)
        .post('/api/v1/stores')
        .set('Cookie', `accessToken=${token}`)
        .send(storeDetails);
      expect(noOrganization.statusCode).toBe(403);

      await createApprovedOrganization(user.id, 'otherapproved@example.com');
      const invalid = await request(app)
        .post('/api/v1/stores')
        .set('Cookie', `accessToken=${token}`)
        .send({ ...storeDetails, location: { lat: 100, lng: 72.8777 } });
      expect(invalid.statusCode).toBe(400);
    });

    it('rejects duplicate store codes', async () => {
      const { user, token } = await createUser({ username: 'codestoreowner' });
      await createApprovedOrganization(user.id, 'codeorg@example.com');
      await StoreModel.create({
        ...storeDetails,
        organizationId: (await organizationModel.findOne({ ownerId: user.id })).id,
        createdBy: user.id,
        managerId: user.id,
      });

      const duplicate = await request(app)
        .post('/api/v1/stores')
        .set('Cookie', `accessToken=${token}`)
        .send({ ...storeDetails, name: 'Another Store' });
      expect(duplicate.statusCode).toBe(409);
    });
  });

  describe('Store management', () => {
    it('lets a manager view only assigned stores without store-admin permissions', async () => {
      const { user: owner } = await createUser({ username: 'managerstoreowner' });
      const { user: otherOwner } = await createUser({ username: 'managerstoreotherowner' });
      const { user: manager, token } = await createUser({
        username: 'assignedmanager',
        role: ROLES.MANAGER,
      });
      const organization = await createApprovedOrganization(owner.id, 'managerorg@example.com');
      const otherOrganization = await createApprovedOrganization(
        otherOwner.id,
        'managerotherorg@example.com',
      );
      const [assignedStore, otherStore] = await Promise.all([
        StoreModel.create({
          ...storeDetails,
          code: 'MANAGER-ASSIGNED',
          organizationId: organization.id,
          createdBy: owner.id,
        }),
        StoreModel.create({
          ...storeDetails,
          code: 'MANAGER-OTHER',
          organizationId: otherOrganization.id,
          createdBy: otherOwner.id,
        }),
      ]);
      assignedStore.managerId = manager.id;
      await assignedStore.save();
      await MembershipModel.create({
        userId: manager.id,
        organizationId: organization.id,
        storeIds: [assignedStore.id],
        role: 'manager',
        status: 'active',
      });

      const list = await request(app)
        .get('/api/v1/stores')
        .set('Cookie', `accessToken=${token}`);
      expect(list.statusCode).toBe(200);
      expect(list.body.data.stores.map((store) => store._id)).toEqual([assignedStore.id]);

      const forbiddenCreate = await request(app)
        .post('/api/v1/stores')
        .set('Cookie', `accessToken=${token}`)
        .send(storeDetails);
      expect(forbiddenCreate.statusCode).toBe(403);
      expect(await StoreModel.exists({ _id: otherStore.id })).not.toBeNull();
    });

    it('lets store administrators create, manage, and remove managers who can log in', async () => {
      const { user: owner, token: ownerToken } = await createUser({
        username: 'managerworkflowowner',
      });
      const organization = await createApprovedOrganization(owner.id, 'managerworkflow@example.com');
      const store = await StoreModel.create({
        ...storeDetails,
        organizationId: organization.id,
        createdBy: owner.id,
      });
      const managerCredentials = {
        fullName: 'Assigned Store Manager',
        username: 'assignedmanagerlogin',
        email: 'assignedmanagerlogin@example.com',
        password: 'Password123',
      };

      const created = await request(app)
        .post(`/api/v1/stores/${store.id}/managers`)
        .set('Cookie', `accessToken=${ownerToken}`)
        .send(managerCredentials);
      expect(created.statusCode).toBe(201);
      expect(created.body.data.manager.role).toBe(ROLES.MANAGER);
      expect(created.body.data.store._id).toBe(store.id);
      const managerId = created.body.data.manager._id;

      const listed = await request(app)
        .get(`/api/v1/stores/${store.id}/managers`)
        .set('Cookie', `accessToken=${ownerToken}`);
      expect(listed.statusCode).toBe(200);
      expect(listed.body.data.managers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: managerId,
            fullName: managerCredentials.fullName,
            isActive: true,
            membershipStatus: 'active',
          }),
        ]),
      );

      const login = await request(app).post('/api/v1/auth/login').send({
        identifier: managerCredentials.username,
        password: managerCredentials.password,
      });
      expect(login.statusCode).toBe(200);
      expect(login.body.data.user.role).toBe(ROLES.MANAGER);

      const deactivated = await request(app)
        .patch(`/api/v1/stores/${store.id}/managers/${managerId}`)
        .set('Cookie', `accessToken=${ownerToken}`)
        .send({ isActive: false });
      expect(deactivated.statusCode).toBe(200);
      expect(deactivated.body.data.isActive).toBe(false);

      const blockedLogin = await request(app).post('/api/v1/auth/login').send({
        identifier: managerCredentials.username,
        password: managerCredentials.password,
      });
      expect(blockedLogin.statusCode).toBe(403);

      const reactivated = await request(app)
        .patch(`/api/v1/stores/${store.id}/managers/${managerId}`)
        .set('Cookie', `accessToken=${ownerToken}`)
        .send({ isActive: true });
      expect(reactivated.statusCode).toBe(200);

      const removed = await request(app)
        .delete(`/api/v1/stores/${store.id}/managers/${managerId}`)
        .set('Cookie', `accessToken=${ownerToken}`);
      expect(removed.statusCode).toBe(200);
      expect(await EmployeeModel.exists({ userId: managerId, status: 'terminated' })).not.toBeNull();
      expect(await MembershipModel.exists({ userId: managerId, storeIds: store.id })).toBeNull();

      const removedManagerLogin = await request(app).post('/api/v1/auth/login').send({
        identifier: managerCredentials.username,
        password: managerCredentials.password,
      });
      expect(removedManagerLogin.statusCode).toBe(403);
    });

    it('lists, fetches, updates, and deletes the owner’s store', async () => {
      const { user, token } = await createUser({ username: 'managementowner' });
      const organization = await createApprovedOrganization(user.id, 'manageorg@example.com');
      const store = await StoreModel.create({
        ...storeDetails,
        organizationId: organization.id,
        createdBy: user.id,
        managerId: user.id,
      });

      const list = await request(app).get('/api/v1/stores').set('Cookie', `accessToken=${token}`);
      expect(list.statusCode).toBe(200);
      expect(list.body.data.stores).toHaveLength(1);

      const fetched = await request(app)
        .get(`/api/v1/stores/${store.id}`)
        .set('Cookie', `accessToken=${token}`);
      expect(fetched.statusCode).toBe(200);
      expect(fetched.body.data.store._id).toBe(store.id);

      const updated = await request(app)
        .patch(`/api/v1/stores/${store.id}`)
        .set('Cookie', `accessToken=${token}`)
        .send({ name: 'Updated Store', address: { city: 'Pune' } });
      expect(updated.statusCode).toBe(200);
      expect(updated.body.data.store.name).toBe('Updated Store');
      expect(updated.body.data.store.address.city).toBe('Pune');

      const deleted = await request(app)
        .delete(`/api/v1/stores/${store.id}`)
        .set('Cookie', `accessToken=${token}`);
      expect(deleted.statusCode).toBe(200);
      expect(await StoreModel.exists({ _id: store.id })).toBeNull();
    });

    it('does not expose stores owned by another administrator', async () => {
      const { user: firstOwner } = await createUser({ username: 'firstowner' });
      const { token: otherOwnerToken } = await createUser({ username: 'secondowner' });
      const organization = await createApprovedOrganization(firstOwner.id, 'firstorg@example.com');
      const store = await StoreModel.create({
        ...storeDetails,
        organizationId: organization.id,
        createdBy: firstOwner.id,
        managerId: firstOwner.id,
      });

      const res = await request(app)
        .get(`/api/v1/stores/${store.id}`)
        .set('Cookie', `accessToken=${otherOwnerToken}`);
      expect(res.statusCode).toBe(404);
    });
  });
});
