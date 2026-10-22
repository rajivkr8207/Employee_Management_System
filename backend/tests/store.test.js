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

const { app } = await import('../src/app.js');
const { default: UserModel } = await import('../src/modules/user/user.model.js');
const { organizationModel } = await import('../src/modules/organization/organization.model.js');
const { StoreModel } = await import('../src/modules/store/store.model.js');
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
      expect(await StoreModel.countDocuments({ createdBy: user.id })).toBe(1);
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
