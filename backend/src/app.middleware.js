import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import Config from './config/config.js';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from './config/redis.js';
import hpp from 'hpp';
import logger from './config/logger.js';

const corsOption = {
  origin: [Config.frontend_url, 'http://localhost:5173', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
};

/**
 * Build rate limiter.
 * Uses Redis store when Redis is reachable; falls back to in-memory store
 * automatically if Redis is offline (rate-limit-redis handles this internally).
 */
const buildRateLimiter = () => {
  if (Config.Node_ENV === 'test') {
    return rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 10000,
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  try {
    return rateLimit({
      store: new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: 'rl:',
      }),
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 100,
      message: 'Too many requests from this IP, please try again in a minute',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.method === 'OPTIONS',
    });
  } catch (err) {
    logger.warn(`[RateLimit] Redis store unavailable, using memory store: ${err.message}`);
    return rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
};

const limiter = buildRateLimiter();

export const Middleware = (app) => {
  app.use(
    express.json({
      limit: '16kb',
      verify: (req, res, buffer) => {
        if (req.originalUrl.startsWith('/api/v1/payments/webhook')) {
          req.rawBody = Buffer.from(buffer);
        }
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '16kb' }));
  app.use(cookieParser());
  app.use(cors(corsOption));
  app.use(morgan('dev'));
  app.use(helmet());
  app.use(compression());
  app.use(express.static('public/dist'));
  app.use(hpp());
  app.use('/api', limiter);
};
