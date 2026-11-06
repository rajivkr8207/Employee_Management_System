import request from 'supertest';
import { jest } from '@jest/globals';
import crypto from 'node:crypto';

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

jest.unstable_mockModule('../src/services/image.service.js', () => ({
  UploadImageToImageKit: async () => ({ url: 'https://ik.imagekit.io/test/enrolled-face.jpg' }),
}));

jest.unstable_mockModule('../src/services/faceRecognition.service.js', () => ({
  createFaceEmbedding: async () => Array(128).fill(0.25),
  matchesFaceEmbedding: () => true,
}));

const { app } = await import('../src/app.js');
const { default: UserModel } = await import('../src/modules/user/user.model.js');
const { default: StoreAdminInvitation } = await import(
  '../src/modules/user/store-admin-invitation.model.js'
);
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

    it('saves an invited registration selfie URL and face template', async () => {
      const inviter = await UserModel.create({
        ...validUser,
        username: 'registrationinviter',
        email: 'registration-inviter@example.com',
      });
      const token = 'a'.repeat(64);
      await StoreAdminInvitation.create({
        email: 'invited-admin@example.com',
        tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + 60_000),
        invitedBy: inviter.id,
      });

      const response = await request(app)
        .post('/api/v1/auth/store-admin/register')
        .field('token', token)
        .field('fullName', 'Invited Admin')
        .field('username', 'invitedadmin')
        .field('password', 'Password123')
        .attach('image', Buffer.from('registration selfie'), {
          filename: 'avatar.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.data.user.avatar).toBe(
        'https://ik.imagekit.io/test/enrolled-face.jpg',
      );
      const savedUser = await UserModel.findOne({ username: 'invitedadmin' }).select(
        '+faceEmbedding',
      );
      expect(savedUser.faceEmbedding).toHaveLength(128);
      expect(savedUser.faceEnrolledAt).toBeTruthy();
    });

    describe('POST /api/v1/auth/face/enroll', () => {
      it('saves the ImageKit URL as avatar and keeps the face embedding private', async () => {
        const user = await UserModel.create({
          ...validUser,
          username: 'faceenrollment',
          email: 'face-enrollment@example.com',
          isVerified: true,
        });
        const response = await request(app)
          .post('/api/v1/auth/face/enroll')
          .set('Cookie', `accessToken=${user.generateAccessToken()}`)
          .attach('image', Buffer.from('test face image'), {
            filename: 'face.jpg',
            contentType: 'image/jpeg',
          });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.user.avatar).toBe(
          'https://ik.imagekit.io/test/enrolled-face.jpg',
        );
        expect(response.body.data.user.faceEmbedding).toBeUndefined();
        const savedUser = await UserModel.findById(user.id).select('+faceEmbedding');
        expect(savedUser.faceEmbedding).toHaveLength(128);
        expect(savedUser.faceEnrolledAt).toBeTruthy();
      });
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
