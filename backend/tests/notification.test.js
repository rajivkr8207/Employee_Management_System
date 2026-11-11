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
const { NotificationModel } = await import('../src/modules/notification/notification.model.js');
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

const setupTestOrg = async () => {
  const { user: owner, token: ownerToken } = await createUser('notifowner', ROLES.STORE_ADMIN);
  const { user: owner2 } = await createUser('notifowner2', ROLES.STORE_ADMIN);
  const { user: empUser1, token: empToken1 } = await createUser('notifemp1');
  const { user: empUser2, token: empToken2 } = await createUser('notifemp2');

  const organization = await organizationModel.create({
    name: 'Notification Org',
    email: 'notiforg@example.com',
    ownerId: owner.id,
    verificationStatus: 'approved',
  });

  const store1 = await StoreModel.create({
    organizationId: organization.id,
    name: 'Branch 1',
    code: 'NOTIF-01',
    location: { lat: 19.076, lng: 72.8777 },
    createdBy: owner.id,
  });

  const store2 = await StoreModel.create({
    organizationId: organization.id,
    name: 'Branch 2',
    code: 'NOTIF-02',
    location: { lat: 19.1, lng: 72.9 },
    createdBy: owner2.id,
  });

  await MembershipModel.create({
    userId: empUser1.id,
    organizationId: organization.id,
    storeIds: [store1.id],
    role: 'employee',
    status: 'active',
  });

  await EmployeeModel.create({
    organizationId: organization.id,
    storeId: store1.id,
    userId: empUser1.id,
    employeeCode: 'NOTIF-EMP-01',
    designation: 'Associate',
    salary: 20000,
  });

  await MembershipModel.create({
    userId: empUser2.id,
    organizationId: organization.id,
    storeIds: [store2.id],
    role: 'employee',
    status: 'active',
  });

  return {
    owner,
    ownerToken,
    empUser1,
    empToken1,
    empUser2,
    empToken2,
    organization,
    store1,
    store2,
  };
};

describe('Notification Module & Attendance Integration', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  it('allows Store Admin to broadcast notifications to the whole organization', async () => {
    const { ownerToken, organization, empUser1, empUser2 } = await setupTestOrg();

    const res = await request(app)
      .post('/api/v1/notifications/broadcast')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        organizationId: organization.id,
        title: 'Org Wide Announcement',
        message: 'All hands meeting tomorrow at 9 AM',
        type: 'announcement',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify notifications created for employees
    const emp1Notifs = await NotificationModel.find({ userId: empUser1.id });
    expect(emp1Notifs.length).toBe(1);
    expect(emp1Notifs[0].title).toBe('Org Wide Announcement');
    expect(emp1Notifs[0].type).toBe('announcement');

    const emp2Notifs = await NotificationModel.find({ userId: empUser2.id });
    expect(emp2Notifs.length).toBe(1);
  });

  it('allows Store Admin to broadcast notifications to a specific store only', async () => {
    const { ownerToken, organization, store1, empUser1, empUser2 } = await setupTestOrg();

    const res = await request(app)
      .post('/api/v1/notifications/broadcast')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        organizationId: organization.id,
        storeId: store1.id,
        title: 'Store 1 Notice',
        message: 'Branch 1 inventory check',
        type: 'info',
      });

    expect(res.status).toBe(201);

    // emp1 is in store1, emp2 is in store2
    const emp1Notifs = await NotificationModel.find({ userId: empUser1.id });
    expect(emp1Notifs.length).toBe(1);
    expect(emp1Notifs[0].title).toBe('Store 1 Notice');

    const emp2Notifs = await NotificationModel.find({ userId: empUser2.id });
    expect(emp2Notifs.length).toBe(0);
  });

  it('rejects regular employee from broadcasting notifications', async () => {
    const { empToken1, organization } = await setupTestOrg();

    const res = await request(app)
      .post('/api/v1/notifications/broadcast')
      .set('Authorization', `Bearer ${empToken1}`)
      .send({
        organizationId: organization.id,
        title: 'Unauthorized Announcement',
        message: 'Test message',
      });

    expect(res.status).toBe(403);
  });

  it('fetches notifications, unread count, marks single as read, and marks all as read', async () => {
    const { empUser1, empToken1 } = await setupTestOrg();

    const n1 = await NotificationModel.create({
      userId: empUser1.id,
      title: 'Alert 1',
      message: 'Notice 1',
      type: 'alert',
    });
    await NotificationModel.create({
      userId: empUser1.id,
      title: 'Alert 2',
      message: 'Notice 2',
      type: 'info',
    });

    // Check unread count
    const countRes = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${empToken1}`);
    expect(countRes.status).toBe(200);
    expect(countRes.body.data.unreadCount).toBe(2);

    // List notifications
    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${empToken1}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.notifications.length).toBe(2);

    // Mark single as read
    const readRes = await request(app)
      .patch(`/api/v1/notifications/${n1.id}/read`)
      .set('Authorization', `Bearer ${empToken1}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.notification.isRead).toBe(true);

    // Mark all as read
    const readAllRes = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${empToken1}`);
    expect(readAllRes.status).toBe(200);

    const updatedCount = await NotificationModel.countDocuments({
      userId: empUser1.id,
      isRead: false,
    });
    expect(updatedCount).toBe(0);
  });

  it('generates a failure notification when employee check-in fails', async () => {
    const { empUser1, empToken1, organization } = await setupTestOrg();

    // Attempt check-in with location but without shift / face -> will fail in service
    const res = await request(app)
      .post('/api/v1/attendance/check-in')
      .set('Authorization', `Bearer ${empToken1}`)
      .send({
        organizationId: organization.id,
        location: { lat: 19.076, lng: 72.8777 },
      });

    expect(res.status).toBe(400);

    // Should have created an alert notification for the employee
    const notifs = await NotificationModel.find({ userId: empUser1.id, type: 'alert' });
    expect(notifs.length).toBe(1);
    expect(notifs[0].title).toBe('Check-in Failed');
    expect(notifs[0].message).toContain('No shift is assigned for today');
  });
});
