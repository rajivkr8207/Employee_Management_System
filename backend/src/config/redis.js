import Redis from 'ioredis';
import logger from './logger.js';
import Config from './config.js';

const redisOptions = {
  host: Config.redis_host || '127.0.0.1',
  port: Config.redis_port || 6379,
  password: Config.redis_password || undefined,
  // Don't block requests if Redis is unavailable — cap retries and fall back gracefully
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 5) {
      logger.warn('[Redis] Max reconnect attempts reached – falling back to DB for all requests.');
      return null; // stop retrying
    }
    return Math.min(times * 1000, 3000);
  },
};

export const redis = new Redis(redisOptions);
export default redis;

redis.on('connect', () => logger.info('[Redis] Connected to server'));
redis.on('ready', () => logger.info('[Redis] Connection ready'));
redis.on('error', (err) => logger.error('[Redis] Connection error:', err?.message || err));
redis.on('end', () => logger.warn('[Redis] Connection closed'));
