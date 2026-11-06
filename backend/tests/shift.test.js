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
const { EmployeeModel } = await import('../src/modules/employee/employee.model.js');
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
    const { user: otherOwner } = await createUser('shiftscopeotherowner');
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
      createdBy: otherOwner.id,
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

  it('lets an assigned manager schedule active employees and prevents duplicate daily assignments', async () => {
    const { user: owner, token: ownerToken } = await createUser('shiftassignowner');
    const { organization, store } = await createOrganizationAndStore(
      owner.id,
      'shiftassignowner@example.org',
      'SHIFT-ASSIGN',
    );
    const { user: manager, token: managerToken } = await createUser(
      'shiftassignmanager',
      ROLES.EMPLOYEE,
    );
    const { user: employeeUser } = await createUser('shiftemployee', ROLES.EMPLOYEE);
    const employee = await EmployeeModel.create({
      organizationId: organization.id,
      storeId: store.id,
      userId: employeeUser.id,
      employeeCode: 'EMP-001',
      designation: 'Cashier',
      salary: 30000,
    });
    await MembershipModel.create({
      userId: manager.id,
      organizationId: organization.id,
      storeIds: [store.id],
      role: 'manager',
    });

    const createdShift = await request(app)
      .post('/api/v1/shifts')
      .set({ Cookie: `accessToken=${ownerToken}` })
      .send(shiftDetails(organization.id, store.id));
    expect(createdShift.statusCode).toBe(201);
    const shiftId = createdShift.body.data.shift._id;
    const headers = { Cookie: `accessToken=${managerToken}` };
    const assignmentData = {
      organizationId: organization.id,
      storeId: store.id,
      employeeId: employee.id,
      shiftId,
      date: '2026-07-14',
    };

    const scheduled = await request(app)
      .post('/api/v1/shifts/assignments')
      .set(headers)
      .send(assignmentData);
    expect(scheduled.statusCode).toBe(201);
    expect(scheduled.body.data.assignment.employeeId._id).toBe(employee.id);
    expect(scheduled.body.data.assignment.shiftId._id).toBe(shiftId);

    const duplicate = await request(app)
      .post('/api/v1/shifts/assignments')
      .set(headers)
      .send(assignmentData);
    expect(duplicate.statusCode).toBe(409);

    const { user: otherStoreOwner } = await createUser('shiftassignotherowner');
    const otherStore = await StoreModel.create({
      organizationId: organization.id,
      name: 'Other Store',
      code: 'SHIFT-ASSIGN-OTHER',
      location: { lat: 19, lng: 72 },
      createdBy: otherStoreOwner.id,
    });
    const { user: otherEmployeeUser } = await createUser('shiftotheremployee', ROLES.EMPLOYEE);
    const otherEmployee = await EmployeeModel.create({
      organizationId: organization.id,
      storeId: otherStore.id,
      userId: otherEmployeeUser.id,
      employeeCode: 'EMP-002',
      designation: 'Stock Associate',
      salary: 30000,
    });
    const mismatchedEmployee = await request(app)
      .post('/api/v1/shifts/assignments')
      .set(headers)
      .send({ ...assignmentData, employeeId: otherEmployee.id, date: '2026-07-15' });
    expect(mismatchedEmployee.statusCode).toBe(404);

    const outOfScope = await request(app)
      .post('/api/v1/shifts/assignments')
      .set(headers)
      .send({
        ...assignmentData,
        storeId: otherStore.id,
        employeeId: otherEmployee.id,
        date: '2026-07-15',
      });
    expect(outOfScope.statusCode).toBe(403);

    const list = await request(app)
      .get(`/api/v1/shifts/assignments?organizationId=${organization.id}&storeId=${store.id}&date=2026-07-14`)
      .set(headers);
    expect(list.statusCode).toBe(200);
    expect(list.body.data.assignments).toHaveLength(1);

    const removed = await request(app)
      .delete(
        `/api/v1/shifts/assignments/${scheduled.body.data.assignment._id}?organizationId=${organization.id}`,
      )
      .set(headers);
    expect(removed.statusCode).toBe(200);
    expect(
      await request(app)
        .get(`/api/v1/shifts/assignments?organizationId=${organization.id}&storeId=${store.id}`)
        .set(headers)
        .then((response) => response.body.data.assignments),
    ).toHaveLength(0);
  });
});
