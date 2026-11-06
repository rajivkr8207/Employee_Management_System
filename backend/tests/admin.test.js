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
    async SendAccountApprovedMail() {}
  },
}));

const { app } = await import('../src/app.js');
const { default: UserModel } = await import('../src/modules/user/user.model.js');
const { organizationModel } = await import('../src/modules/organization/organization.model.js');
const { StoreModel } = await import('../src/modules/store/store.model.js');
const { EmployeeModel } = await import('../src/modules/employee/employee.model.js');
const { connectTestDB, closeTestDB, clearTestDB } = await import('./setup.js');

const createUser = async (username, role, properties = {}) =>
  UserModel.create({
    fullName: username,
    username,
    email: `${username}@example.com`,
    password: 'Password123',
    role,
    isVerified: true,
    ...properties,
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

describe('Admin directory endpoints', () => {
  it('returns all users, stores, employees, and live dashboard counts to an admin', async () => {
    const admin = await createUser('systemadmin', ROLES.ADMIN);
    const storeAdmin = await createUser('storeadmin', ROLES.STORE_ADMIN);
    const manager = await createUser('manager', ROLES.MANAGER);
    const employeeUser = await createUser('employee', ROLES.EMPLOYEE);
    await createUser('pendinguser', ROLES.STORE_ADMIN, { isApproved: false });
    const organization = await organizationModel.create({
      name: 'Example Organization',
      email: 'organization@example.com',
      ownerId: storeAdmin._id,
      verificationStatus: 'approved',
    });
    const store = await StoreModel.create({
      organizationId: organization._id,
      name: 'Example Store',
      code: 'EXAMPLE-01',
      location: { lat: 19, lng: 72 },
      managerId: manager._id,
      createdBy: storeAdmin._id,
    });
    await EmployeeModel.create([
      {
        organizationId: organization._id,
        storeId: store._id,
        userId: manager._id,
        employeeCode: 'MGR-001',
        designation: 'Store Manager',
        salary: 0,
      },
      {
        organizationId: organization._id,
        storeId: store._id,
        userId: employeeUser._id,
        employeeCode: 'EMP-001',
        designation: 'Cashier',
        salary: 25000,
      },
    ]);
    const token = admin.generateAccessToken();

    const [usersResponse, storesResponse, employeesResponse, statsResponse] = await Promise.all([
      request(app).get('/api/v1/admin/users').set('Cookie', `accessToken=${token}`),
      request(app).get('/api/v1/admin/stores').set('Cookie', `accessToken=${token}`),
      request(app).get('/api/v1/admin/employees').set('Cookie', `accessToken=${token}`),
      request(app).get('/api/v1/admin/dashboard/stats').set('Cookie', `accessToken=${token}`),
    ]);

    expect(usersResponse.statusCode).toBe(200);
    expect(usersResponse.body.data.users).toHaveLength(5);
    expect(usersResponse.body.data.users[0]).not.toHaveProperty('password');
    expect(storesResponse.statusCode).toBe(200);
    expect(storesResponse.body.data.stores[0]).toMatchObject({
      name: 'Example Store',
      employeeCount: 2,
      organizationId: { name: 'Example Organization' },
      managerId: { fullName: 'manager' },
    });
    expect(employeesResponse.statusCode).toBe(200);
    expect(employeesResponse.body.data.employees).toHaveLength(2);
    expect(employeesResponse.body.data.employees[0]).not.toHaveProperty('salary');
    expect(statsResponse.statusCode).toBe(200);
    expect(statsResponse.body.data).toMatchObject({
      users: { total: 5, pending: 1 },
      stores: { total: 1, active: 1 },
      employees: { total: 2, active: 2 },
      managers: { total: 1, approved: 1 },
    });
  });

  it('approves new stores into active state and persists rejected store reviews', async () => {
    const admin = await createUser('storeverificationadmin', ROLES.ADMIN);
    const storeAdmin = await createUser('storeverificationowner', ROLES.STORE_ADMIN);
    const organization = await organizationModel.create({
      name: 'Verification Organization',
      email: 'verification-organization@example.com',
      ownerId: storeAdmin._id,
      verificationStatus: 'approved',
    });
    const pendingStore = await StoreModel.create({
      organizationId: organization._id,
      name: 'Pending Approval Store',
      code: 'PENDING-VERIFY-01',
      location: { lat: 19, lng: 72 },
      status: 'inactive',
      verificationStatus: 'pending',
      createdBy: storeAdmin._id,
    });
    const rejectedStore = await StoreModel.create({
      organizationId: organization._id,
      name: 'Rejected Store',
      code: 'PENDING-VERIFY-02',
      location: { lat: 20, lng: 73 },
      status: 'inactive',
      verificationStatus: 'pending',
      createdBy: await createUser('storeverificationowner2', ROLES.STORE_ADMIN).then(
        (user) => user._id,
      ),
    });
    const token = admin.generateAccessToken();

    const pendingList = await request(app)
      .get('/api/v1/admin/store-verifications?status=pending')
      .set('Cookie', `accessToken=${token}`);
    expect(pendingList.statusCode).toBe(200);
    expect(pendingList.body.data.stores).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: pendingStore.id,
          verificationStatus: 'pending',
          createdBy: expect.objectContaining({ email: storeAdmin.email }),
        }),
      ]),
    );

    const approved = await request(app)
      .patch(`/api/v1/admin/store-verifications/${pendingStore.id}/approve`)
      .set('Cookie', `accessToken=${token}`);
    expect(approved.statusCode).toBe(200);
    expect(approved.body.data.store.status).toBe('active');
    expect(approved.body.data.store.verificationStatus).toBe('approved');
    expect(approved.body.data.store.reviewedBy).toBe(admin.id);
    expect(await StoreModel.findById(pendingStore.id).then((store) => store.status)).toBe('active');

    const rejected = await request(app)
      .patch(`/api/v1/admin/store-verifications/${rejectedStore.id}/reject`)
      .set('Cookie', `accessToken=${token}`)
      .send({ reason: 'Store details could not be verified' });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.body.data.store).toMatchObject({
      status: 'inactive',
      verificationStatus: 'rejected',
      rejectionReason: 'Store details could not be verified',
      reviewedBy: admin.id,
    });
  });

  it('approves and rejects store administrator verification in the database', async () => {
    const admin = await createUser('accountreviewadmin', ROLES.ADMIN);
    const approvedUser = await createUser('accounttoapprove', ROLES.STORE_ADMIN, {
      isApproved: false,
      approvalStatus: 'pending',
    });
    const rejectedUser = await createUser('accounttoreject', ROLES.STORE_ADMIN, {
      isApproved: false,
      approvalStatus: 'pending',
    });
    const token = admin.generateAccessToken();

    const approved = await request(app)
      .patch(`/api/v1/auth/store-admin/${approvedUser.id}/approve`)
      .set('Cookie', `accessToken=${token}`);
    expect(approved.statusCode).toBe(200);
    expect(approved.body.data.user).toMatchObject({
      isApproved: true,
      isActive: true,
      approvalStatus: 'approved',
    });

    const rejected = await request(app)
      .patch(`/api/v1/auth/store-admin/${rejectedUser.id}/reject`)
      .set('Cookie', `accessToken=${token}`)
      .send({ reason: 'Account details were not verified' });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.body.data.user).toMatchObject({
      isApproved: false,
      isActive: false,
      approvalStatus: 'rejected',
      rejectionReason: 'Account details were not verified',
    });

    const pending = await request(app)
      .get('/api/v1/auth/store-admin/pending')
      .set('Cookie', `accessToken=${token}`);
    expect(pending.statusCode).toBe(200);
    expect(pending.body.data.users).toHaveLength(0);
    expect(await UserModel.findById(approvedUser.id).then((user) => user.isApproved)).toBe(true);
    expect(await UserModel.findById(rejectedUser.id).then((user) => user.approvalStatus)).toBe(
      'rejected',
    );
  });

  it('rejects unauthenticated and non-admin directory requests', async () => {
    const storeAdmin = await createUser('restrictedadmin', ROLES.STORE_ADMIN);
    const token = storeAdmin.generateAccessToken();

    const unauthenticated = await request(app).get('/api/v1/admin/users');
    const forbidden = await request(app)
      .get('/api/v1/admin/users')
      .set('Cookie', `accessToken=${token}`);

    expect(unauthenticated.statusCode).toBe(401);
    expect(forbidden.statusCode).toBe(403);
  });
});
