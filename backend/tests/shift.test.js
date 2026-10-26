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
    quit: async () => {},
  },
}));

const { app } = await import('../src/app.js');
const { default: UserModel } = await import('../src/modules/user/user.model.js');
const { organizationModel } = await import('../src/modules/organization/organization.model.js');
const { StoreModel } = await import('../src/modules/store/store.model.js');
const { MembershipModel } = await import('../src/modules/membership/membership.model.js');
const { ShiftModel } = await import('../src/modules/shift/shift.model.js');
const { connectTestDB, closeTestDB, clearTestDB } = await import('./setup.js');

const createUser = async (username, role = ROLES.STORE_ADMIN) => {
  const user = await UserModel.create({
    fullName: username,
    username,
    email: `${username}@example.com`,
    password: 'Password123',
    role,
    isVerified: true,
  });
  return { user, token: user.generateAccessToken() };
};

const createOrganizationAndStore = async (ownerId, email, code = 'SHIFT-STORE') => {
  const organization = await organizationModel.create({
    name: 'Shift Organization',
    email,
    ownerId,
    verificationStatus: 'approved',
  });
  const store = await StoreModel.create({
    organizationId: organization.id,
    name: 'Main Store',
    code,
    location: { lat: 19, lng: 72 },
    createdBy: ownerId,
  });
  return { organization, store };
};

const shiftDetails = (organizationId, storeId, overrides = {}) => ({
  organizationId,
  storeId,
  name: 'Morning',
  startTime: '09:00',
  endTime: '17:00',
  ...overrides,
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

describe('Shift API', () => {
  it('creates, lists, fetches, updates, and deletes a shift for an authorized organization', async () => {
    const { user: owner, token } = await createUser('shiftowner');
    const { organization, store } = await createOrganizationAndStore(
      owner.id,
      'shiftowner@example.org',
    );
    const headers = { Cookie: `accessToken=${token}` };

    const created = await request(app)
      .post('/api/v1/shifts')
      .set(headers)
      .send(shiftDetails(organization.id, store.id));
    expect(created.statusCode).toBe(201);
    expect(created.body.data.shift.name).toBe('Morning');
    expect(created.body.data.shift.organizationId._id).toBe(organization.id);
    expect(created.body.data.shift.storeId._id).toBe(store.id);

    const shiftId = created.body.data.shift._id;
    const list = await request(app)
      .get(`/api/v1/shifts?organizationId=${organization.id}`)
      .set(headers);
    expect(list.statusCode).toBe(200);
    expect(list.body.data.shifts).toHaveLength(1);

    const fetched = await request(app)
      .get(`/api/v1/shifts/${shiftId}?organizationId=${organization.id}`)
      .set(headers);
    expect(fetched.statusCode).toBe(200);
    expect(fetched.body.data.shift._id).toBe(shiftId);

    const updated = await request(app)
      .patch(`/api/v1/shifts/${shiftId}?organizationId=${organization.id}`)
      .set(headers)
      .send({ name: 'Evening', startTime: '14:00', endTime: '22:00' });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.data.shift.name).toBe('Evening');
    expect(updated.body.data.shift.startTime).toBe('14:00');

    const deleted = await request(app)
      .delete(`/api/v1/shifts/${shiftId}?organizationId=${organization.id}`)
      .set(headers);
    expect(deleted.statusCode).toBe(200);
    expect(await ShiftModel.exists({ _id: shiftId })).toBeNull();
  });

  it('rejects duplicate names within a store and invalid shift times', async () => {
    const { user: owner, token } = await createUser('shiftduplicate');
    const { organization, store } = await createOrganizationAndStore(
      owner.id,
      'shiftduplicate@example.org',
    );
    const headers = { Cookie: `accessToken=${token}` };
    const details = shiftDetails(organization.id, store.id);

    const created = await request(app).post('/api/v1/shifts').set(headers).send(details);
    expect(created.statusCode).toBe(201);

    const duplicate = await request(app).post('/api/v1/shifts').set(headers).send(details);
    expect(duplicate.statusCode).toBe(409);

    const invalid = await request(app)
      .post('/api/v1/shifts')
      .set(headers)
      .send(shiftDetails(organization.id, store.id, { name: 'Invalid', startTime: '25:00' }));
    expect(invalid.statusCode).toBe(400);

    const sameTime = await request(app)
      .post('/api/v1/shifts')
      .set(headers)
      .send(shiftDetails(organization.id, store.id, { name: 'Invalid Equal', endTime: '09:00' }));
    expect(sameTime.statusCode).toBe(400);
  });

  it('limits managers to assigned stores and blocks unauthenticated requests', async () => {
    const { user: owner } = await createUser('shiftscopeowner');
    const { user: scopedManager, token: managerToken } = await createUser(
      'shiftscopemanager',
      ROLES.EMPLOYEE,
    );
    const { organization, store: allowedStore } = await createOrganizationAndStore(
      owner.id,
      'shiftscope@example.org',
      'SHIFT-ALLOWED',
    );
    const deniedStore = await StoreModel.create({
      organizationId: organization.id,
      name: 'Other Store',
      code: 'SHIFT-DENIED',
      location: { lat: 19, lng: 72 },
      createdBy: owner.id,
    });
    await MembershipModel.create({
      userId: scopedManager.id,
      organizationId: organization.id,
      storeIds: [allowedStore.id],
      role: 'manager',
    });

    const unauthorized = await request(app)
      .post('/api/v1/shifts')
      .send(shiftDetails(organization.id, allowedStore.id));
    expect(unauthorized.statusCode).toBe(401);

    const headers = { Cookie: `accessToken=${managerToken}` };
    const allowed = await request(app)
      .post('/api/v1/shifts')
      .set(headers)
      .send(shiftDetails(organization.id, allowedStore.id));
    expect(allowed.statusCode).toBe(201);

    const denied = await request(app)
      .post('/api/v1/shifts')
      .set(headers)
      .send(shiftDetails(organization.id, deniedStore.id, { name: 'Denied' }));
    expect(denied.statusCode).toBe(403);
  });
});
