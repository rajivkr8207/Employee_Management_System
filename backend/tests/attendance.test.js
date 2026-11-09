import request from 'supertest';
import { jest } from '@jest/globals';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
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
const { ShiftModel } = await import('../src/modules/shift/shift.model.js');
const { ShiftAssignmentModel } = await import('../src/modules/shift/shift-assignment.model.js');
const { createFaceEmbedding } = await import('../src/services/faceRecognition.service.js');
const { connectTestDB, closeTestDB, clearTestDB } = await import('./setup.js');

const sampleFacePath = fileURLToPath(
  new URL('../node_modules/@vladmandic/face-api/demo/sample2.jpg', import.meta.url),
);
let testFaceEmbedding;

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
  await UserModel.updateOne(
    { _id: employeeUser.id },
    { $set: { faceEmbedding: testFaceEmbedding } },
  );
  await MembershipModel.create({
    userId: employeeUser.id,
    organizationId: organization.id,
    storeIds: [store.id],
    role: 'employee',
  });
  const now = new Date();
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(now)
    .reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
  const shiftTime = (offsetMinutes) => {
    const date = new Date(now.getTime() + offsetMinutes * 60_000);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .reduce((time, part) => ({ ...time, [part.type]: part.value }), {});
    return `${parts.hour}:${parts.minute}`;
  };
  const shift = await ShiftModel.create({
    organizationId: organization.id,
    storeId: store.id,
    name: 'Current shift',
    startTime: shiftTime(-15),
    endTime: shiftTime(15),
  });
  await ShiftAssignmentModel.create({
    organizationId: organization.id,
    storeId: store.id,
    employeeId: employee.id,
    shiftId: shift.id,
    date: `${dateParts.year}-${dateParts.month}-${dateParts.day}`,
    createdBy: owner.id,
  });
  return { ownerToken, employeeToken, organization, store, employee };
};

beforeAll(async () => {
  await connectTestDB();
  testFaceEmbedding = await createFaceEmbedding(await readFile(sampleFacePath));
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Attendance API', () => {
  it('returns today shift eligibility and rejects attendance outside the store radius', async () => {
    const { employeeToken, organization } = await createEmployeeSetup();
    const headers = { Cookie: `accessToken=${employeeToken}` };

    const status = await request(app)
      .get(`/api/v1/attendance/today?organizationId=${organization.id}&lat=19&lng=72`)
      .set(headers);
    expect(status.statusCode).toBe(200);
    expect(status.body.data.shift.name).toBe('Current shift');
    expect(status.body.data.insideGeofence).toBe(true);
    expect(status.body.data.canCheckIn).toBe(true);
    expect(status.body.data.store.radius).toBe(100);
    expect(status.body.data.faceEnrolled).toBe(true);

    const outsideLocation = { lat: 19.002, lng: 72 };
    const outsideStatus = await request(app)
      .get(
        `/api/v1/attendance/today?organizationId=${organization.id}&lat=${outsideLocation.lat}&lng=${outsideLocation.lng}`,
      )
      .set(headers);
    expect(outsideStatus.body.data.insideGeofence).toBe(false);
    expect(outsideStatus.body.data.canCheckIn).toBe(false);

    const blockedCheckIn = await request(app)
      .post('/api/v1/attendance/check-in')
      .set(headers)
      .field('organizationId', organization.id)
      .field('lat', String(outsideLocation.lat))
      .field('lng', String(outsideLocation.lng))
      .attach('image', sampleFacePath);
    expect(blockedCheckIn.statusCode).toBe(403);
  });

  it('records self check-in and check-out once per employee per store-local day', async () => {
    const { employeeToken, organization, employee } = await createEmployeeSetup();
    const headers = { Cookie: `accessToken=${employeeToken}` };

    const checkIn = await request(app)
      .post('/api/v1/attendance/check-in')
      .set(headers)
      .field('organizationId', organization.id)
      .field('lat', '19')
      .field('lng', '72')
      .attach('image', sampleFacePath);
    expect(checkIn.statusCode).toBe(201);
    expect(checkIn.body.data.attendance.source).toBe('self');
    expect(checkIn.body.data.attendance.employeeId._id).toBe(employee.id);

    const duplicateCheckIn = await request(app)
      .post('/api/v1/attendance/check-in')
      .set(headers)
      .field('organizationId', organization.id)
      .field('lat', '19')
      .field('lng', '72')
      .attach('image', sampleFacePath);
    expect(duplicateCheckIn.statusCode).toBe(409);

    const checkOut = await request(app)
      .post('/api/v1/attendance/check-out')
      .set(headers)
      .field('organizationId', organization.id)
      .field('lat', '19')
      .field('lng', '72')
      .attach('image', sampleFacePath);
    expect(checkOut.statusCode).toBe(200);
    expect(checkOut.body.data.attendance.checkOut).toBeTruthy();

    const duplicateCheckOut = await request(app)
      .post('/api/v1/attendance/check-out')
      .set(headers)
      .field('organizationId', organization.id)
      .field('lat', '19')
      .field('lng', '72')
      .attach('image', sampleFacePath);
    expect(duplicateCheckOut.statusCode).toBe(409);
    expect(await AttendanceModel.countDocuments({ employeeId: employee.id })).toBe(1);
  });

  it('rejects a face that does not match the employee enrollment', async () => {
    const { employeeToken, organization, employee } = await createEmployeeSetup();
    await UserModel.updateOne(
      { _id: employee.userId },
      { $set: { faceEmbedding: Array(128).fill(0) } },
    );
    const rejected = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Cookie', `accessToken=${employeeToken}`)
      .field('organizationId', organization.id)
      .field('lat', '19')
      .field('lng', '72')
      .attach('image', sampleFacePath);

    expect(rejected.statusCode).toBe(401);
    expect(await AttendanceModel.countDocuments({ employeeId: employee.id })).toBe(0);
  });

  it('rejects a camera image containing multiple faces', async () => {
    const { employeeToken, organization } = await createEmployeeSetup();
    const response = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Cookie', `accessToken=${employeeToken}`)
      .field('organizationId', organization.id)
      .field('lat', '19')
      .field('lng', '72')
      .attach(
        'image',
        fileURLToPath(
          new URL('../node_modules/@vladmandic/face-api/demo/sample1.jpg', import.meta.url),
        ),
      );

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toMatch(/exactly one face/i);
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
      .field('organizationId', '507f1f77bcf86cd799439011')
      .field('lat', '91')
      .field('lng', '72')
      .attach('image', sampleFacePath);
    expect(invalidLocation.statusCode).toBe(400);
  });
});
