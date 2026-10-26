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
const { EmployeeModel } = await import('../src/modules/employee/employee.model.js');
const { MembershipModel } = await import('../src/modules/membership/membership.model.js');
const { LeaveModel } = await import('../src/modules/leave/leave.model.js');
const { connectTestDB, closeTestDB, clearTestDB } = await import('./setup.js');

const createUser = async (username, role = ROLES.EMPLOYEE) => {
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

const createLeaveSetup = async () => {
  const { user: owner, token: ownerToken } = await createUser('leaveowner', ROLES.STORE_ADMIN);
  const { user: employeeUser, token: employeeToken } = await createUser('leaveemployee');
  const organization = await organizationModel.create({
    name: 'Leave Organization',
    email: 'leave@example.com',
    ownerId: owner.id,
    verificationStatus: 'approved',
  });
  const store = await StoreModel.create({
    organizationId: organization.id,
    name: 'Main Store',
    code: 'LEAVE-01',
    location: { lat: 19, lng: 72 },
    createdBy: owner.id,
  });
  const employee = await EmployeeModel.create({
    organizationId: organization.id,
    storeId: store.id,
    userId: employeeUser.id,
    employeeCode: 'LEV-001',
    designation: 'Cashier',
    salary: 25000,
  });
  await MembershipModel.create({
    userId: employeeUser.id,
    organizationId: organization.id,
    storeIds: [store.id],
    role: 'employee',
  });
  return { ownerToken, employeeToken, organization, employee };
};

const application = (organizationId, overrides = {}) => ({
  organizationId,
  from: '2026-11-10',
  to: '2026-11-12',
  reason: 'Family commitment',
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

describe('Leave API', () => {
  it('allows employees to apply, view their leave, and prevents overlapping requests', async () => {
    const { employeeToken, organization, employee } = await createLeaveSetup();
    const headers = { Cookie: `accessToken=${employeeToken}` };
    const created = await request(app)
      .post('/api/v1/leaves')
      .set(headers)
      .send(application(organization.id));

    expect(created.statusCode).toBe(201);
    expect(created.body.data.leave.employeeId._id).toBe(employee.id);
    expect(created.body.data.leave.status).toBe('pending');
    expect(created.body.data.leave.reason).toBe('Family commitment');

    const overlapping = await request(app)
      .post('/api/v1/leaves')
      .set(headers)
      .send(application(organization.id, { from: '2026-11-12', to: '2026-11-13' }));
    expect(overlapping.statusCode).toBe(409);

    const mine = await request(app)
      .get(`/api/v1/leaves/mine?organizationId=${organization.id}&status=pending`)
      .set(headers);
    expect(mine.statusCode).toBe(200);
    expect(mine.body.data.leaves).toHaveLength(1);
  });

  it('lets an authorized manager approve or reject pending leave and records the approver', async () => {
    const { ownerToken, employeeToken, organization } = await createLeaveSetup();
    const created = await request(app)
      .post('/api/v1/leaves')
      .set('Cookie', `accessToken=${employeeToken}`)
      .send(application(organization.id));
    const leaveId = created.body.data.leave._id;

    const approved = await request(app)
      .patch(`/api/v1/leaves/${leaveId}/review?organizationId=${organization.id}`)
      .set('Cookie', `accessToken=${ownerToken}`)
      .send({ status: 'approved' });
    expect(approved.statusCode).toBe(200);
    expect(approved.body.data.leave.status).toBe('approved');
    expect(approved.body.data.leave.approvedBy).toBeTruthy();
    expect(approved.body.data.leave.approvedAt).toBeTruthy();

    const secondReview = await request(app)
      .patch(`/api/v1/leaves/${leaveId}/review?organizationId=${organization.id}`)
      .set('Cookie', `accessToken=${ownerToken}`)
      .send({ status: 'rejected' });
    expect(secondReview.statusCode).toBe(409);
  });

  it('allows cancellation only for pending requests and rejects invalid date ranges', async () => {
    const { employeeToken, organization } = await createLeaveSetup();
    const created = await request(app)
      .post('/api/v1/leaves')
      .set('Cookie', `accessToken=${employeeToken}`)
      .send(application(organization.id));
    const leaveId = created.body.data.leave._id;

    const cancelled = await request(app)
      .delete(`/api/v1/leaves/${leaveId}?organizationId=${organization.id}`)
      .set('Cookie', `accessToken=${employeeToken}`);
    expect(cancelled.statusCode).toBe(200);
    expect(await LeaveModel.exists({ _id: leaveId })).toBeNull();

    const invalid = await request(app)
      .post('/api/v1/leaves')
      .set('Cookie', `accessToken=${employeeToken}`)
      .send(application(organization.id, { from: '2026-11-13', to: '2026-11-12' }));
    expect(invalid.statusCode).toBe(400);

    const unauthorized = await request(app)
      .get(`/api/v1/leaves?organizationId=${organization.id}`)
      .set('Cookie', `accessToken=${employeeToken}`);
    expect(unauthorized.statusCode).toBe(403);
  });
});
