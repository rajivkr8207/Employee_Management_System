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

jest.unstable_mockModule('../src/services/mail.service.js', () => ({
  MailService: class {
    async SendRegisterMail() {
      return true;
    }
  },
}));

const { app } = await import('../src/app.js');
const { default: UserModel } = await import('../src/modules/user/user.model.js');
const { connectTestDB, closeTestDB, clearTestDB } = await import('./setup.js');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Auth API', () => {
  const validUser = {
    fullName: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should reject direct registration without an invitation', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validUser);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(await UserModel.findOne({ email: validUser.email })).toBeNull();
    });

    it('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await UserModel.create({
        ...validUser,
        role: 'employ',
        isVerified: true,
        isApproved: true,
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: validUser.email,
        password: validUser.password,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeTruthy();
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: validUser.email,
        password: 'wrongpassword',
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with unregistered email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: 'notfound@example.com',
        password: 'Password123',
      });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
});
