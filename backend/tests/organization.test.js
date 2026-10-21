import request from 'supertest';
import { jest } from '@jest/globals';

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
const { connectTestDB, closeTestDB, clearTestDB } = await import('./setup.js');

const createUser = async ({ username, role = 'employ' }) => {
  const user = await UserModel.create({
    fullName: 'Test User',
    username,
    email: `${username}@example.com`,
    password: 'Password123',
    role,
    isVerified: true,
  });
  return { user, token: user.generateAccessToken() };
};

const organizationDetails = {
  name: 'Test Organization',
  email: 'organization@example.com',
  phone: '9876543210',
  businessType: 'Retail',
  address: {
    street: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
  },
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

describe('Organization API', () => {
  describe('POST /api/v1/organizations', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/organizations').send(organizationDetails);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('creates an organization for the authenticated owner', async () => {
      const { user, token } = await createUser({ username: 'orgowner' });
      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Cookie', `accessToken=${token}`)
        .send(organizationDetails);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organization.name).toBe(organizationDetails.name);
      expect(res.body.data.organization.email).toBe(organizationDetails.email);
      expect(res.body.data.organization.verificationStatus).toBe('pending');
      expect(res.body.data.organization.ownerId).toBe(user.id);

      const updatedUser = await UserModel.findById(user.id);
      expect(updatedUser.role).toBe('storeadmin');
      expect(await organizationModel.countDocuments({ ownerId: user.id })).toBe(1);
    });

    it('rejects invalid and duplicate organization submissions', async () => {
      const { user, token } = await createUser({ username: 'duplicateowner' });
      await organizationModel.create({
        ...organizationDetails,
        email: organizationDetails.email,
        ownerId: user.id,
      });

      const duplicateOwner = await request(app)
        .post('/api/v1/organizations')
        .set('Cookie', `accessToken=${token}`)
        .send({ ...organizationDetails, email: 'different@example.com' });
      expect(duplicateOwner.statusCode).toBe(409);

      const invalid = await request(app)
        .post('/api/v1/organizations')
        .set('Cookie', `accessToken=${token}`)
        .send({ ...organizationDetails, unexpected: true });
      expect(invalid.statusCode).toBe(400);

      const { token: otherOwnerToken } = await createUser({ username: 'otherorgowner' });
      const duplicateEmail = await request(app)
        .post('/api/v1/organizations')
        .set('Cookie', `accessToken=${otherOwnerToken}`)
        .send({ ...organizationDetails, name: 'Another Organization' });
      expect(duplicateEmail.statusCode).toBe(409);
    });
  });

  describe('GET /api/v1/organizations/mine', () => {
    it('returns the authenticated owner’s organization or a not-found response', async () => {
      const { user, token } = await createUser({ username: 'myorgowner' });

      const missing = await request(app)
        .get('/api/v1/organizations/mine')
        .set('Cookie', `accessToken=${token}`);
      expect(missing.statusCode).toBe(404);

      await organizationModel.create({ ...organizationDetails, ownerId: user.id });
      const res = await request(app)
        .get('/api/v1/organizations/mine')
        .set('Cookie', `accessToken=${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.organization.ownerId).toBe(user.id);
    });
  });

  describe('Organization approval', () => {
    it('allows an administrator to list and approve pending organizations', async () => {
      const { user: owner } = await createUser({ username: 'pendingowner' });
      const { user: admin, token } = await createUser({ username: 'orgadmin', role: 'admin' });
      const organization = await organizationModel.create({
        ...organizationDetails,
        ownerId: owner.id,
      });

      const pending = await request(app)
        .get('/api/v1/organizations/pending')
        .set('Cookie', `accessToken=${token}`);
      expect(pending.statusCode).toBe(200);
      expect(pending.body.data.organizations).toHaveLength(1);
      expect(pending.body.data.organizations[0].ownerId.email).toBe(owner.email);

      const approved = await request(app)
        .patch(`/api/v1/organizations/${organization.id}/approval`)
        .set('Cookie', `accessToken=${token}`)
        .send({ verificationStatus: 'approved' });
      expect(approved.statusCode).toBe(200);
      expect(approved.body.data.organization.verificationStatus).toBe('approved');
      expect(approved.body.data.organization.verifiedBy).toBe(admin.id);

      const repeatedReview = await request(app)
        .patch(`/api/v1/organizations/${organization.id}/approval`)
        .set('Cookie', `accessToken=${token}`)
        .send({ verificationStatus: 'rejected' });
      expect(repeatedReview.statusCode).toBe(404);
    });

    it('does not allow a non-administrator to list pending organizations', async () => {
      const { token } = await createUser({ username: 'regularowner' });
      const res = await request(app)
        .get('/api/v1/organizations/pending')
        .set('Cookie', `accessToken=${token}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
