/**
 * Centralized Redis cache utility with graceful degradation.
 *
 * Every method swallows Redis errors and logs a warning so that a Redis
 * outage never disrupts a live request — the caller simply falls through
 * to the database.
 */
import { redis } from '../config/redis.js';
import logger from '../config/logger.js';

// ─── Low-level primitives ────────────────────────────────────────────────────

/** Retrieve a JSON value from cache. Returns `null` on miss or error. */
export const getCache = async (key) => {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn(`[Cache] getCache(${key}): ${err.message}`);
    return null;
  }
};

/** Store a JSON-serialisable value with a TTL (seconds, default 5 min). */
export const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(`[Cache] setCache(${key}): ${err.message}`);
  }
};

/** Delete a single key. */
export const deleteCache = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn(`[Cache] deleteCache(${key}): ${err.message}`);
  }
};

/**
 * Delete all keys matching a glob pattern (e.g. `shifts:org:abc:*`).
 *
 * Uses SCAN instead of KEYS so it is non-blocking on large keyspaces.
 */
export const deleteCacheByPattern = async (pattern) => {
  try {
    let cursor = '0';
    const keys = [];
    do {
      const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.warn(`[Cache] deleteCacheByPattern(${pattern}): ${err.message}`);
  }
};

// ─── Cache-Aside helper ───────────────────────────────────────────────────────

/**
 * Cache-aside: return cached value when present, otherwise call `fetchFn`,
 * store its result, and return it. Falls back to `fetchFn` transparently if
 * Redis is unreachable.
 *
 * @param {string}   key          Cache key
 * @param {Function} fetchFn      Async function that returns the data
 * @param {number}   ttlSeconds   TTL in seconds (default 300 = 5 min)
 */
export const getOrSetCache = async (key, fetchFn, ttlSeconds = 300) => {
  const cached = await getCache(key);
  if (cached !== null) return cached;

  const result = await fetchFn();
  if (result !== null && result !== undefined) {
    await setCache(key, result, ttlSeconds);
  }
  return result;
};

