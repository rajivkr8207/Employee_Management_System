/**
 * ══════════════════════════════════════════════════════════════════════════════
 *   USER JOURNEY & REAL API CALLS
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Implements real, discovered API routes from the backend:
 *  - /api/v1/health (Baseline throughput)
 *  - /api/v1/auth/profile (Redis session cache)
 *  - /api/v1/admin/dashboard/stats (Redis 17-query analytics cache)
 *  - /api/v1/stores (Store listing cache)
 *  - /api/v1/shifts (Shift catalog cache)
 *  - /api/v1/notifications (Notifications catalog)
 *
 * Safe & non-destructive.
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── METRICS DEFINITION ──────────────────────────────────────────────────────
export const successfulRequests = new Counter('successful_requests');
export const rateLimitedRequests = new Counter('rate_limited_requests');
export const serverErrorRequests = new Counter('server_error_requests');
export const healthCheckLatency = new Trend('healthcheck_duration_ms', true);
export const cacheHitLatency = new Trend('cache_hit_duration_ms', true);
export const errorRate = new Rate('custom_failure_rate');

/**
 * Standard setup function for all scenarios:
 *  1. Checks health.
 *  2. Logs in admin/user to obtain an access token.
 */
export function setupAuth(baseUrl, adminEmail, adminPassword) {
  // 1. Health check
  const healthRes = http.get(`${baseUrl}/health`, {
    headers: { 'x-stress-test': 'ems-benchmark-pass' },
  });
  const isHealthy = healthRes.status === 200;

  // 2. Authentication
  let accessToken = null;
  const loginPayload = JSON.stringify({
    identifier: adminEmail,
    password: adminPassword,
  });

  const loginRes = http.post(`${baseUrl}/auth/login`, loginPayload, {
    headers: {
      'Content-Type': 'application/json',
      'x-stress-test': 'ems-benchmark-pass',
    },
  });

  if (loginRes.status === 200) {
    try {
      accessToken = loginRes.json()?.data?.accessToken || null;
    } catch {
      // ignore
    }
  }

  return {
    baseUrl,
    accessToken,
    hasAuth: Boolean(accessToken),
    isHealthy,
  };
}

/**
 * Default VU journey across discovered endpoints.
 */
export function runUserJourney(data) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-stress-test': 'ems-benchmark-pass',
  };

  if (data.accessToken) {
    headers.Authorization = `Bearer ${data.accessToken}`;
    headers.Cookie = `accessToken=${data.accessToken}`;
  }

  // 1. Health check (Baseline infrastructure)
  group('01_Health', () => {
    const res = http.get(`${data.baseUrl}/health`, { headers });
    healthCheckLatency.add(res.timings.duration);

    const isOk = check(res, {
      'Health 200': (r) => r.status === 200,
    });
    recordResult(res, isOk);
  });

  // 2. Authenticated Profile (Redis auth:user:<id> cache)
  if (data.hasAuth) {
    group('02_Profile_Cache', () => {
      const res = http.get(`${data.baseUrl}/auth/profile`, { headers });
      cacheHitLatency.add(res.timings.duration);

      const isOk = check(res, {
        'Profile 200': (r) => r.status === 200,
        'Profile fast (<300ms)': (r) => r.timings.duration < 300,
      });
      recordResult(res, isOk);
    });

    // 3. Admin Dashboard Analytics (Redis admin:dashboard:stats cache)
    group('03_Dashboard_Stats_Cache', () => {
      const res = http.get(`${data.baseUrl}/admin/dashboard/stats`, { headers });
      cacheHitLatency.add(res.timings.duration);

      const isOk = check(res, {
        'Dashboard 200 or 403': (r) => r.status === 200 || r.status === 403,
        'Dashboard fast (<300ms)': (r) => r.timings.duration < 300,
      });
      recordResult(res, isOk);
    });

    // 4. Stores Directory (Redis stores:user:<userId> cache)
    group('04_Stores_Directory', () => {
      const res = http.get(`${data.baseUrl}/stores`, { headers });

      const isOk = check(res, {
        'Stores 200 or 403': (r) => r.status === 200 || r.status === 403,
      });
      recordResult(res, isOk);
    });

    // 5. Notifications
    group('05_Notifications', () => {
      const res = http.get(`${data.baseUrl}/notifications`, { headers });

      const isOk = check(res, {
        'Notifications 200': (r) => r.status === 200,
      });
      recordResult(res, isOk);
    });
  }

  // Think time with jitter (200ms - 800ms)
  sleep(0.2 + Math.random() * 0.6);
}

function recordResult(res, isCheckPassed) {
  if (res.status === 200 || res.status === 201) {
    successfulRequests.add(1);
    errorRate.add(0);
  } else if (res.status === 429) {
    rateLimitedRequests.add(1);
    errorRate.add(0); // Rate limits are not server errors
  } else {
    if (res.status >= 500) {
      serverErrorRequests.add(1);
    }
    errorRate.add(1);
  }
}
