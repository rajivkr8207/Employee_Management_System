import Redis from 'ioredis';
import logger from './logger.js';
import Config from './Config.js';

const redisOptions = {
  host: Config.redis_host || undefined,
  port: Config.redis_port,
  password: Config.redis_password,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(redisOptions);

redis.on('connect', () => {
  logger.info('Redis connected to server');
});

redis.on('ready', () => {
  logger.info('Redis connection is ready');
});

redis.on('error', (err) => {
  logger.error('Error occurred with Redis connection:', err?.message || err);
});

redis.on('end', () => {
  logger.warn('Redis connection closed');
});
