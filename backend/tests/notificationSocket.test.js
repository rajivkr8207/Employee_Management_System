import { createServer } from 'node:http';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { io as createClient } from 'socket.io-client';

jest.setTimeout(30_000);

jest.unstable_mockModule('../src/config/redis.js', () => {
  const instance = {
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 1,
    scan: async () => ['0', []],
    call: async () => 1,
    on: () => {},
    quit: async () => {},
  };
  return { default: instance, redis: instance };
});

const { app } = await import('../src/app.js');
const Config = (await import('../src/config/config.js')).default;
const User = (await import('../src/modules/user/user.model.js')).default;
const { initializeSocket, closeSocketServer } = await import('../src/config/socket.js');
const {
  createNotification,
  markAsRead,
  markAllAsRead,
} = await import('../src/modules/notification/notification.service.js');
const { connectTestDB, closeTestDB, clearTestDB } = await import('./setup.js');

let server;
let socketUrl;

const connect = (options = {}) =>
  createClient(socketUrl, {
    forceNew: true,
    reconnection: false,
    transports: ['websocket'],
    ...options,
  });

beforeAll(async () => {
  await connectTestDB();
  server = createServer(app);
  initializeSocket(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  socketUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeSocketServer();
  await closeTestDB();
});

describe('Notification Socket.IO delivery', () => {
  it('authenticates a user and delivers saved notification and read events', async () => {
    const user = await User.create({
      fullName: 'Socket Recipient',
      username: 'socketrecipient',
      email: 'socketrecipient@example.com',
      password: 'Password123',
      isVerified: true,
    });
    const socket = connect({ auth: { token: user.generateAccessToken() } });
    const connected = new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });
    const received = new Promise((resolve) => socket.once('notification:new', resolve));

    try {
      await connected;
      const saved = await createNotification({
        userId: user.id,
        title: 'Real-time alert',
        message: 'A new notification is ready.',
        type: 'alert',
      });

      await expect(received).resolves.toMatchObject({
        _id: saved.id,
        title: 'Real-time alert',
        userId: user.id,
      });

      const updated = new Promise((resolve) => socket.once('notification:updated', resolve));
      await markAsRead(saved.id, user.id);
      await expect(updated).resolves.toMatchObject({ _id: saved.id, isRead: true });

      await createNotification({
        userId: user.id,
        title: 'Second alert',
        message: 'A second notification is ready.',
      });
      const readAll = new Promise((resolve) => socket.once('notification:read-all', resolve));
      await markAllAsRead(user.id);
      await expect(readAll).resolves.toBeNull();
    } finally {
      socket.disconnect();
    }
  });

  it('rejects clients without a valid access token', async () => {
    const socket = connect({ auth: { token: 'invalid-token' } });
    const error = new Promise((resolve) => socket.once('connect_error', resolve));

    try {
      await expect(error).resolves.toMatchObject({
        message: 'Invalid or expired access token',
      });
    } finally {
      socket.disconnect();
    }
  });

  it('rejects access tokens without an expiration', async () => {
    const user = await User.create({
      fullName: 'Socket Recipient',
      username: 'socketrecipient',
      email: 'socketrecipient@example.com',
      password: 'Password123',
      isVerified: true,
    });
    const token = jwt.sign({ id: user.id }, Config.jwt_access_secret);
    const socket = connect({ auth: { token } });
    const error = new Promise((resolve) => socket.once('connect_error', resolve));

    try {
      await expect(error).resolves.toMatchObject({
        message: 'Invalid or expired access token',
      });
    } finally {
      socket.disconnect();
    }
  });
});
