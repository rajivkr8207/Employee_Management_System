/**
 * ══════════════════════════════════════════════════════════════════════════════
 *   STRESS TESTING CONFIGURATION & DISCOVERED API ENDPOINTS
 * ══════════════════════════════════════════════════════════════════════════════
 */

export const CONFIG = {
  // Target environment
  BASE_URL: process?.env?.BASE_URL || (typeof __ENV !== 'undefined' && __ENV.BASE_URL) || 'http://localhost:8000/api/v1',
  ADMIN_EMAIL: process?.env?.ADMIN_EMAIL || (typeof __ENV !== 'undefined' && __ENV.ADMIN_EMAIL) || 'admin@ems.com',
  ADMIN_PASSWORD: process?.env?.ADMIN_PASSWORD || (typeof __ENV !== 'undefined' && __ENV.ADMIN_PASSWORD) || 'Admin@123456',

  // Redis configuration (detected from project config)
  REDIS_HOST: process?.env?.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: Number(process?.env?.REDIS_PORT) || 6379,
  REDIS_PASSWORD: process?.env?.REDIS_PASSWORD || undefined,

  // MongoDB configuration
  MONGODB_URI: process?.env?.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee_management',

  // Safety controls
  ALLOW_REMOTE: process?.env?.ALLOW_REMOTE === 'true' || (typeof __ENV !== 'undefined' && __ENV.ALLOW_REMOTE === 'true'),
  MAX_VUS_CAP: 2000,
  MAX_DURATION_SECONDS: 3600,

  // Acceptance criteria / performance thresholds
  ACCEPTANCE_CRITERIA: {
    maxErrorRatePercent: 1.0,     // < 1% HTTP error rate
    p95LatencyMs: 300,            // < 300ms p95 response time
    p99LatencyMs: 1000,           // < 1000ms p99 response time
    maxCacheLatencyMs: 150,       // < 150ms for Redis-cached routes
  },

  // Discovered real API routes from backend/src/app.routes.js
  ENDPOINTS: {
    health: '/health',
    login: '/auth/login',
    profile: '/auth/profile',                 // Redis cached: auth:user:<id>
    adminStats: '/admin/dashboard/stats',     // Redis cached: admin:dashboard:stats
    adminUsers: '/admin/users',
    adminStores: '/admin/stores',
    adminEmployees: '/admin/employees',
    adminLogs: '/admin/activity-logs',
    stores: '/stores',                         // Redis cached: stores:user:<userId>
    shifts: '/shifts',                         // Redis cached: shifts:list:<orgId>
    departments: '/departments',
    notifications: '/notifications',
    unreadCount: '/notifications/unread-count',
  },
};

/**
 * Validate that the target host is safe (defaults to localhost).
 */
export function assertSafeTarget(urlStr) {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!isLocal && !CONFIG.ALLOW_REMOTE) {
      throw new Error(
        `[SECURITY HALT] Target ${urlStr} is NOT localhost. To prevent accidental DDoS against remote/production servers, set ALLOW_REMOTE=true.`,
      );
    }
  } catch (err) {
    if (err.message.includes('SECURITY HALT')) throw err;
    throw new Error(`Invalid BASE_URL: ${urlStr}`);
  }
}
