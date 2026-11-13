import { clearTimeout, setTimeout } from 'node:timers';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Config from './config.js';
import logger from './logger.js';
import User from '../modules/user/user.model.js';
import { getCache } from '../utils/cache.js';

let socketServer;

const userRoom = (userId) => `user:${userId}`;

const getAccessToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken) return authToken;

  const authorization = socket.handshake.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length);
  }

  const accessTokenCookie = socket.handshake.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('accessToken='));
  return accessTokenCookie?.slice('accessToken='.length) || null;
};

const authenticateSocket = async (socket, next) => {
  const token = getAccessToken(socket);
  if (!token) return next(new Error('Authentication required'));

  let decoded;
  try {
    decoded = jwt.verify(token, Config.jwt_access_secret);
  } catch {
    return next(new Error('Invalid or expired access token'));
  }
  if (!decoded || typeof decoded !== 'object' || !decoded.id || !Number.isFinite(decoded.exp)) {
    return next(new Error('Invalid or expired access token'));
  }

  try {
    if (await getCache(`blacklist:token:${token}`)) {
      return next(new Error('Access token has been revoked'));
    }

    const user = await User.findById(decoded.id).select('_id isActive isBlocked isApproved').lean();
    if (!user || !user.isActive || user.isBlocked || !user.isApproved) {
      return next(new Error('Account is not authorized for notifications'));
    }

    socket.data.userId = user._id.toString();
    socket.data.tokenExpiresAt = decoded.exp;
    return next();
  } catch {
    return next(new Error('Socket authentication failed'));
  }
};

export const initializeSocket = (httpServer) => {
  if (socketServer) return socketServer;

  const allowedOrigins = [
    Config.frontend_url,
    'http://localhost:5173',
    'http://localhost:5175',
  ].filter(Boolean);

  socketServer = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });
  socketServer.use(authenticateSocket);
  socketServer.on('connection', (socket) => {
    socket.join(userRoom(socket.data.userId));

    const expiresIn = Math.max(socket.data.tokenExpiresAt * 1000 - Date.now(), 0);
    const expiryTimer = setTimeout(() => socket.disconnect(true), expiresIn);
    expiryTimer.unref?.();
    socket.on('disconnect', () => clearTimeout(expiryTimer));
  });

  logger.info('[Socket.IO] Notification server initialized');
  return socketServer;
};

export const emitToUser = (userId, event, payload) => {
  if (!socketServer || !userId) return false;
  socketServer.to(userRoom(userId.toString())).emit(event, payload);
  return true;
};

export const closeSocketServer = async () => {
  if (!socketServer) return;
  const currentServer = socketServer;
  socketServer = null;
  await new Promise((resolve) => currentServer.close(resolve));
};
