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
const { AttendanceModel } = await import('../src/modules/attendence/attendence.model.js');
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

const createEmployeeSetup = async () => {
  const { user: owner, token: ownerToken } = await createUser('attendanceowner', ROLES.STORE_ADMIN);
  const { user: employeeUser, token: employeeToken } = await createUser('attendanceemployee');
  const organization = await organizationModel.create({
    name: 'Attendance Organization',
    email: 'attendance@example.com',
    ownerId: owner.id,
    verificationStatus: 'approved',
  });
  const store = await StoreModel.create({
    organizationId: organization.id,
    name: 'Main Store',
    code: 'ATTENDANCE-01',
    location: { lat: 19, lng: 72 },
    createdBy: owner.id,
  });
  const employee = await EmployeeModel.create({
    organizationId: organization.id,
    storeId: store.id,
    userId: employeeUser.id,
    employeeCode: 'ATT-001',
    designation: 'Cashier',
    salary: 25000,
  });
  await MembershipModel.create({
    userId: employeeUser.id,
    organizationId: organization.id,
    storeIds: [store.id],
    role: 'employee',
  });
  return { ownerToken, employeeToken, organization, store, employee };
};

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Attendance API', () => {
  it('records self check-in and check-out once per employee per UTC day', async () => {
    const { employeeToken, organization, employee } = await createEmployeeSetup();
    const headers = { Cookie: `accessToken=${employeeToken}` };

    const checkIn = await request(app)
      .post('/api/v1/attendance/check-in')
      .set(headers)
      .send({ organizationId: organization.id, location: { lat: 19, lng: 72 } });
    expect(checkIn.statusCode).toBe(201);
    expect(checkIn.body.data.attendance.source).toBe('self');
    expect(checkIn.body.data.attendance.employeeId._id).toBe(employee.id);

    const duplicateCheckIn = await request(app)
      .post('/api/v1/attendance/check-in')
      .set(headers)
      .send({ organizationId: organization.id });
    expect(duplicateCheckIn.statusCode).toBe(409);

    const checkOut = await request(app)
      .post('/api/v1/attendance/check-out')
      .set(headers)
      .send({ organizationId: organization.id });
    expect(checkOut.statusCode).toBe(200);
    expect(checkOut.body.data.attendance.checkOut).toBeTruthy();

    const duplicateCheckOut = await request(app)
      .post('/api/v1/attendance/check-out')
      .set(headers)
      .send({ organizationId: organization.id });
    expect(duplicateCheckOut.statusCode).toBe(409);
    expect(await AttendanceModel.countDocuments({ employeeId: employee.id })).toBe(1);
  });

  it('lets employees view their own records and managers create audited corrections', async () => {
    const { ownerToken, employeeToken, organization, employee } = await createEmployeeSetup();
    const manualRecord = await request(app)
      .post('/api/v1/attendance')
      .set('Cookie', `accessToken=${ownerToken}`)
      .send({
        organizationId: organization.id,
        employeeId: employee.id,
        date: '2026-02-01',
        checkIn: '2026-02-01T09:00:00.000Z',
        checkOut: '2026-02-01T17:00:00.000Z',
        status: 'present',
        correctionReason: 'Missed clock-in',
      });
    expect(manualRecord.statusCode).toBe(201);
    expect(manualRecord.body.data.attendance.source).toBe('manual');
    const attendanceId = manualRecord.body.data.attendance._id;

    const mine = await request(app)
      .get(`/api/v1/attendance/mine?organizationId=${organization.id}&date=2026-02-01`)
      .set('Cookie', `accessToken=${employeeToken}`);
    expect(mine.statusCode).toBe(200);
    expect(mine.body.data.attendance).toHaveLength(1);

    const correction = await request(app)
      .patch(`/api/v1/attendance/${attendanceId}?organizationId=${organization.id}`)
      .set('Cookie', `accessToken=${ownerToken}`)
      .send({
        checkOut: '2026-02-01T18:00:00.000Z',
        correctionReason: 'Updated after manager review',
      });
    expect(correction.statusCode).toBe(200);
    expect(correction.body.data.attendance.checkOut).toBe('2026-02-01T18:00:00.000Z');
    expect(correction.body.data.attendance.correctionReason).toBe('Updated after manager review');
    expect(correction.body.data.attendance.correctedBy).toBeTruthy();
  });

  it('rejects unauthenticated and malformed check-ins', async () => {
    const unauthenticated = await request(app)
      .post('/api/v1/attendance/check-in')
      .send({ organizationId: '507f1f77bcf86cd799439011' });
    expect(unauthenticated.statusCode).toBe(401);

    const { employeeToken } = await createEmployeeSetup();
    const invalidLocation = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Cookie', `accessToken=${employeeToken}`)
      .send({ organizationId: '507f1f77bcf86cd799439011', location: { lat: 91, lng: 72 } });
    expect(invalidLocation.statusCode).toBe(400);
  });
});
