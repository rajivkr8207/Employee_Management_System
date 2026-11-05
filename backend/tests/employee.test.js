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
const { EmployeeModel } = await import('../src/modules/employee/employee.model.js');
const { MembershipModel } = await import('../src/modules/membership/membership.model.js');
const { connectTestDB, closeTestDB, clearTestDB } = await import('./setup.js');

const createUser = async (username, role = ROLES.STORE_ADMIN) => {
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

const createOrganizationAndStores = async (ownerId) => {
  const organization = await organizationModel.create({
    name: 'Approved Organization',
    email: `${ownerId}@organization.example`,
    ownerId,
    verificationStatus: 'approved',
  });
  const stores = await Promise.all(
    ['EMP-STORE-1', 'EMP-STORE-2'].map((code) =>
      StoreModel.create({
        organizationId: organization.id,
        name: code,
        code,
        location: { lat: 19, lng: 72 },
        createdBy: ownerId,
      }),
    ),
  );
  return { organization, stores };
};

const employeeDetails = (organizationId, storeId) => ({
  organizationId,
  storeId,
  role: 'employee',
  employeeCode: 'EMP-001',
  designation: 'Cashier',
  salary: 25000,
  Dob: '1997-08-15',
  joiningDate: '2026-01-15',
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

describe('Employee and membership flow', () => {
  it('allows a manager to onboard employees only in assigned stores', async () => {
    const { user: owner } = await createUser('manageremployeeowner');
    const { organization, stores } = await createOrganizationAndStores(owner.id);
    const { user: manager, token } = await createUser('manageremployee', ROLES.MANAGER);
    stores[0].managerId = manager.id;
    await stores[0].save();
    await MembershipModel.create({
      userId: manager.id,
      organizationId: organization.id,
      storeIds: [stores[0].id],
      role: 'manager',
      status: 'active',
    });

    const allowed = await request(app)
      .post('/api/v1/employees')
      .set('Cookie', `accessToken=${token}`)
      .send({
        ...employeeDetails(organization.id, stores[0].id),
        user: {
          fullName: 'Manager Added Employee',
          username: 'manageraddedemployee',
          email: 'manageraddedemployee@example.com',
          password: 'Password123',
        },
      });
    expect(allowed.statusCode).toBe(201);
    expect(allowed.body.data.employee.userId.username).toBe('manageraddedemployee');

    const forbidden = await request(app)
      .post('/api/v1/employees')
      .set('Cookie', `accessToken=${token}`)
      .send({
        ...employeeDetails(organization.id, stores[1].id),
        employeeCode: 'EMP-OTHER-STORE',
        user: {
          fullName: 'Unassigned Store Employee',
          username: 'unassignedemployee',
          email: 'unassignedemployee@example.com',
          password: 'Password123',
        },
      });
    expect(forbidden.statusCode).toBe(403);
  });

  it('lets an onboarded employee log in and retrieve their own profile', async () => {
    const { user: owner, token } = await createUser('employeeprofileowner');
    const { organization, stores } = await createOrganizationAndStores(owner.id);
    const created = await request(app)
      .post('/api/v1/employees')
      .set('Cookie', `accessToken=${token}`)
      .send({
        ...employeeDetails(organization.id, stores[0].id),
        user: {
          fullName: 'Employee Login',
          username: 'employeelogin',
          email: 'employeelogin@example.com',
          password: 'Password123',
        },
      });

    expect(created.statusCode).toBe(201);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'employeelogin', password: 'Password123' });
    expect(login.statusCode).toBe(200);

    const profile = await request(app)
      .get('/api/v1/employees/me')
      .set('Cookie', login.headers['set-cookie']);
    expect(profile.statusCode).toBe(200);
    expect(profile.body.data.employee.userId.username).toBe('employeelogin');
    expect(profile.body.data.employee.employeeCode).toBe('EMP-001');
    expect(profile.body.data.employee.storeId.name).toBe(stores[0].name);
  });

  it('creates a user, membership, and employee and returns populated user details', async () => {
    const { user: owner, token } = await createUser('staffflowowner');
    const { organization, stores } = await createOrganizationAndStores(owner.id);
    const response = await request(app)
      .post('/api/v1/employees')
      .set('Cookie', `accessToken=${token}`)
      .send({
        ...employeeDetails(organization.id, stores[0].id),
        role: 'manager',
        storeIds: [stores[0].id, stores[1].id],
        user: {
          fullName: 'New Staff Member',
          username: 'newstaff',
          email: 'newstaff@example.com',
          password: 'Password123',
        },
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.employee.userId.email).toBe('newstaff@example.com');
    expect(response.body.data.employee.storeId._id).toBe(stores[0].id);
    expect(new Date(response.body.data.employee.Dob).toISOString()).toContain('1997-08-15');
    expect(await EmployeeModel.countDocuments({ organizationId: organization.id })).toBe(1);

    const createdUser = await UserModel.findOne({ email: 'newstaff@example.com' });
    const membership = await MembershipModel.findOne({
      userId: createdUser.id,
      organizationId: organization.id,
    });
    expect(membership.role).toBe('manager');
    expect(membership.storeIds.map(String)).toEqual([stores[0].id, stores[1].id]);
    expect((await EmployeeModel.findOne({ userId: createdUser.id })).salary).toBe(25000);
  });

  it('adds an existing user and rejects duplicate membership or employee code', async () => {
    const { user: owner, token } = await createUser('existingflowowner');
    const { organization, stores } = await createOrganizationAndStores(owner.id);
    const existing = await UserModel.create({
      fullName: 'Existing Staff',
      username: 'existingstaff',
      email: 'existingstaff@example.com',
      password: 'Password123',
      isVerified: true,
    });
    const payload = {
      ...employeeDetails(organization.id, stores[0].id),
      userId: existing.id,
    };

    const created = await request(app)
      .post('/api/v1/employees')
      .set('Cookie', `accessToken=${token}`)
      .send(payload);
    expect(created.statusCode).toBe(201);

    const duplicateMembership = await request(app)
      .post('/api/v1/employees')
      .set('Cookie', `accessToken=${token}`)
      .send({ ...payload, employeeCode: 'EMP-002' });
    expect(duplicateMembership.statusCode).toBe(409);

    const otherUser = await UserModel.create({
      fullName: 'Second Staff',
      username: 'secondstaff',
      email: 'secondstaff@example.com',
      password: 'Password123',
      isVerified: true,
    });
    const duplicateCode = await request(app)
      .post('/api/v1/employees')
      .set('Cookie', `accessToken=${token}`)
      .send({ ...payload, userId: otherUser.id });
    expect(duplicateCode.statusCode).toBe(409);
    expect(await EmployeeModel.countDocuments({ organizationId: organization.id })).toBe(1);
  });

  it('limits staff listing to active membership roles and assigned stores', async () => {
    const { user: owner } = await createUser('scopeowner');
    const { organization, stores } = await createOrganizationAndStores(owner.id);
    const { user: scopedAdmin, token } = await createUser('scopedadmin', ROLES.EMPLOYEE);
    await MembershipModel.create({
      userId: scopedAdmin.id,
      organizationId: organization.id,
      storeIds: [stores[0].id],
      role: 'store_admin',
    });
    const staff = await UserModel.create({
      fullName: 'Scoped Staff',
      username: 'scopedstaff',
      email: 'scopedstaff@example.com',
      password: 'Password123',
      isVerified: true,
    });
    await MembershipModel.create({
      userId: staff.id,
      organizationId: organization.id,
      storeIds: [stores[0].id],
      role: 'employee',
    });
    await EmployeeModel.create({
      ...employeeDetails(organization.id, stores[0].id),
      userId: staff.id,
    });

    const list = await request(app)
      .get(`/api/v1/employees?organizationId=${organization.id}`)
      .set('Cookie', `accessToken=${token}`);
    expect(list.statusCode).toBe(200);
    expect(list.body.data.employees).toHaveLength(1);
    expect(list.body.data.employees[0].userId.fullName).toBe('Scoped Staff');

    const forbiddenStore = await request(app)
      .get(`/api/v1/employees?organizationId=${organization.id}&storeId=${stores[1].id}`)
      .set('Cookie', `accessToken=${token}`);
    expect(forbiddenStore.statusCode).toBe(403);

    const membershipList = await request(app)
      .get(`/api/v1/memberships?organizationId=${organization.id}`)
      .set('Cookie', `accessToken=${token}`);
    expect(membershipList.statusCode).toBe(200);
    expect(membershipList.body.data.memberships).toHaveLength(2);
    expect(
      membershipList.body.data.memberships.some(
        (membership) => membership.userId.username === 'scopedstaff',
      ),
    ).toBe(true);
  });
});
