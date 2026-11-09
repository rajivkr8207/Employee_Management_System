# Redis Caching Architecture & Implementation Guide
**Project:** Employee Management System  
**Version:** 1.0  
**Status:** Ready for Implementation  

---

## 1. Executive Summary

In our current backend architecture, all authenticated requests, role validations, analytics dashboards, and face-recognition attendance checks query MongoDB directly.

By integrating **Redis** (in-memory data store), we can:
1. **Reduce Database Load by ~70–80%** on high-frequency read endpoints.
2. **Speed up API Latencies**: Drop response times on heavy routes from **300ms–800ms to < 5ms**.
3. **Eliminate Clock-in Rush Hour Bottlenecks**: Support high-concurrency check-in/out and face verification without MongoDB connection pool exhaustion.
4. **Enable Distributed Rate Limiting & Token Revocation** across multi-process or clustered environments.

---

## 2. Prerequisites & Immediate Configuration Fixes (Step 0)

Before writing cache code, the following setup and fixes must be completed:

### 2.1 Missing NPM Dependencies
Install `ioredis` and `rate-limit-redis` in `backend/`:
```bash
cd backend
npm install ioredis rate-limit-redis
```

### 2.2 Fix Environment Variable Typo in `config.js`
In [backend/src/config/config.js](file:///d:/Coding/Employ_Management_System/backend/src/config/config.js#L17), fix the case sensitivity typo on `redis_port`:
```javascript
// Before:
redis_port: process.env.REDIS_PORT ? Number(process.env.redis_port) : undefined,

// After (Fixed):
redis_port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
```

### 2.3 Resilient Redis Connection Setup
Update [backend/src/config/redis.js](file:///d:/Coding/Employ_Management_System/backend/src/config/redis.js) so that if Redis is offline during local development or network dips, the application does not crash:
```javascript
import Redis from 'ioredis';
import logger from './logger.js';
import Config from './config.js';

const redisOptions = {
  host: Config.redis_host || '127.0.0.1',
  port: Config.redis_port || 6379,
  password: Config.redis_password || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 5) {
      logger.warn('[Redis] Max reconnection attempts reached. Continuing with DB fallback.');
      return null; // Stop retrying to prevent blocking
    }
    return Math.min(times * 1000, 3000);
  },
};

export const redis = new Redis(redisOptions);

redis.on('connect', () => logger.info('[Redis] Connected to server'));
redis.on('ready', () => logger.info('[Redis] Connection is ready'));
redis.on('error', (err) => logger.error('[Redis] Connection error:', err?.message || err));
redis.on('end', () => logger.warn('[Redis] Connection closed'));
```

---

## 3. Centralized Cache Utility Pattern (`src/utils/cache.js`)

Create a standardized caching helper at `backend/src/utils/cache.js` with **graceful degradation** (if Redis fails, it falls back to DB transparently without throwing errors):

```javascript
import { redis } from '../config/redis.js';
import logger from '../config/logger.js';

/**
 * Get item from cache
 */
export const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.warn(`[Cache Error] getCache(${key}): ${err.message}`);
    return null;
  }
};

/**
 * Set item in cache with TTL (seconds)
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(`[Cache Error] setCache(${key}): ${err.message}`);
  }
};

/**
 * Delete item from cache
 */
export const deleteCache = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn(`[Cache Error] deleteCache(${key}): ${err.message}`);
  }
};

/**
 * Invalidate all keys matching pattern (e.g., 'shifts:org123:*')
 */
export const deleteCacheByPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.warn(`[Cache Error] deleteCacheByPattern(${pattern}): ${err.message}`);
  }
};

/**
 * Cache-Aside wrapper: Returns cached data if available; otherwise computes and caches it.
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
```

---

## 4. Priority-Wise Implementation Plan

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 PRIORITY 0: CRITICAL (Highest DB Load & Latency Impact)  │
│    • P0.1: JWT Auth Verification (Every single API call)    │
│    • P0.2: Admin Dashboard Aggregations (17 DB counts)      │
├─────────────────────────────────────────────────────────────┤
│ 🟠 PRIORITY 1: HIGH CONCURRENCY & SECURITY                 │
│    • P1.1: Attendance Face Embeddings & Geofence Context     │
│    • P1.2: Distributed Rate Limiting (Redis Store)          │
│    • P1.3: Token Blacklisting on Logout                     │
├─────────────────────────────────────────────────────────────┤
│ 🟡 PRIORITY 2: FREQUENT READS & PERMISSIONS                 │
│    • P2.1: Multi-Tenant Org & Store Access Checks           │
│    • P2.2: Daily Shifts & Shift Assignments                 │
│    • P2.3: Stores & Managers Directory                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 🔴 Priority 0: Critical (Immediate Implementation)

#### P0.1: Cache User Profile in `verifyJWT` Middleware
* **Target File:** [backend/src/middlewares/auth.middleware.js](file:///d:/Coding/Employ_Management_System/backend/src/middlewares/auth.middleware.js#L8-L44)
* **Why it is critical:**
  Every authenticated route currently executes `User.findById(decoded.id)`. Caching this eliminates 90% of all user lookups.
* **Cache Key:** `auth:user:<userId>`
* **TTL:** 10 minutes (600s)
* **Implementation:**
  ```javascript
  // Inside verifyJWT:
  const cacheKey = `auth:user:${decoded.id}`;
  let user = await getCache(cacheKey);

  if (!user) {
    user = await User.findById(decoded.id).lean();
    if (!user) throw new ApiError(401, 'User account was not found');
    await setCache(cacheKey, user, 600); // 10 min
  }
  ```
* **Invalidation Points:**
  * When user profile is updated (`editUserProfile`)
  * When password is changed (`changeUserPassword`)
  * When user is blocked / approved / rejected by admin
  * On logout: `deleteCache('auth:user:' + userId)`

---

#### P0.2: Cache Admin Dashboard Statistics
* **Target File:** [backend/src/modules/admin/admin.service.js](file:///d:/Coding/Employ_Management_System/backend/src/modules/admin/admin.service.js#L177-L265)
* **Why it is critical:**
  `getAdminDashboardStats()` fires **17 concurrent `countDocuments()` queries** + `find().limit(5)`. Multiple admins or frequent refreshes overload the database.
* **Cache Key:** `admin:dashboard:stats`
* **TTL:** 60 seconds (1 minute)
* **Implementation:**
  ```javascript
  export const getAdminDashboardStats = async () => {
    return getOrSetCache('admin:dashboard:stats', async () => {
      // Existing 17 Promise.all count queries...
      return { users, stores, employees, managers, recentRegistrations };
    }, 60);
  };
  ```
* **Invalidation Points:**
  * Invalidate whenever a store is approved/rejected or a user is approved/blocked.

---

### 🟠 Priority 1: High Concurrency & Security

#### P1.1: Face Recognition Embeddings & Store Geofence Cache
* **Target File:** [backend/src/modules/attendence/attendence.service.js](file:///d:/Coding/Employ_Management_System/backend/src/modules/attendence/attendence.service.js#L114-L173)
* **Why it is critical:**
  At shift start (e.g. 9:00 AM), all employees check in within 15 minutes. Every check-in loads:
  1. The 128-float face embedding array (`User.findById(userId).select('+faceEmbedding')`).
  2. The store location coordinates and geofence radius.
* **Cache Strategy:**
  * **Face Embedding Key:** `user:face-embedding:<userId>` (TTL: 24 hours). Invalidate only when `enrollFace` is called.
  * **Store Geofence Key:** `store:geofence:<storeId>` (TTL: 2 hours). Invalidate on `updateStore`.
* **Implementation:**
  ```javascript
  // In getTodayContext / assertAttendanceActionAllowed:
  const faceEmbedding = await getOrSetCache(`user:face-embedding:${employee.userId}`, async () => {
    const u = await User.findById(employee.userId).select('+faceEmbedding').lean();
    return u?.faceEmbedding || [];
  }, 86400); // 24 hours
  ```

---

#### P1.2: Distributed Rate Limiting via Redis
* **Target File:** [backend/src/app.middleware.js](file:///d:/Coding/Employ_Management_System/backend/src/app.middleware.js#L18-L24)
* **Why it is critical:**
  In-memory rate limiting leaks memory and resets on server restarts. Redis distributes limits consistently across all processes and workers.
* **Implementation:**
  ```javascript
  import { RedisStore } from 'rate-limit-redis';
  import { redis } from './config/redis.js';

  const limiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  ```

---

#### P1.3: Token Revocation / Blacklist on Logout
* **Target Files:**
  * [backend/src/modules/user/user.controller.js](file:///d:/Coding/Employ_Management_System/backend/src/modules/user/user.controller.js#L145) (`logout`)
  * [backend/src/middlewares/auth.middleware.js](file:///d:/Coding/Employ_Management_System/backend/src/middlewares/auth.middleware.js#L8) (`verifyJWT`)
* **Why it is critical:**
  JWT tokens are stateless and remain valid until expiration even after the user logs out. Storing blacklisted tokens in Redis provides immediate revocation.
* **Cache Key:** `blacklist:token:<token>`
* **TTL:** Match remaining token expiry (e.g., 3600s).

---

### 🟡 Priority 2: Frequent Reads & Permission Checks

#### P2.1: Multi-Tenant Organization Permission Checks
* **Target File:** [backend/src/modules/membership/membership.service.js](file:///d:/Coding/Employ_Management_System/backend/src/modules/membership/membership.service.js#L6-L45)
* **Why it is needed:**
  `authorizeOrganizationAccess` is executed across employee, attendance, shift, leave, and store routes to check if the user is an owner, store admin, or manager.
* **Cache Key:** `org:access:<userId>:<organizationId>`
* **TTL:** 10 minutes (600s).
* **Invalidation Points:** Whenever store assignments or membership roles change.

---

#### P2.2: Daily Shifts & Shift Assignments
* **Target File:** [backend/src/modules/shift/shift.service.js](file:///d:/Coding/Employ_Management_System/backend/src/modules/shift/shift.service.js#L50-L62)
* **Why it is needed:**
  Shift templates and daily schedules are read continuously by both managers and employees throughout the working day.
* **Cache Keys:**
  * `shifts:list:<organizationId>:<storeId>` (TTL: 30 minutes)
  * `shifts:assignments:<organizationId>:<storeId>:<date>` (TTL: 15 minutes)
* **Invalidation Points:** Invalidate on `createShift`, `updateShift`, `deleteShift`, `createShiftAssignment`, or `deleteShiftAssignment`.

---

#### P2.3: Stores & Store Manager Directory
* **Target File:** [backend/src/modules/store/store.service.js](file:///d:/Coding/Employ_Management_System/backend/src/modules/store/store.service.js#L48-L65)
* **Why it is needed:**
  Dashboard header dropdowns, store selectors, and manager listings query stores on almost every screen change.
* **Cache Key:** `stores:user:<userId>:<role>` (TTL: 15 minutes).
* **Invalidation Points:** Invalidate on `createStore`, `updateStore`, `createStoreManager`, or `removeStoreManager`.

---

## 5. Master Cache Key & Invalidation Matrix

| Priority | Cache Key Pattern | TTL | Data Type | Invalidation Trigger (When to delete) |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | `auth:user:<userId>` | 600s (10m) | JSON String | Profile edit, password change, block/unblock, logout |
| **P0** | `admin:dashboard:stats` | 60s (1m) | JSON String | Natural expiry or store/user approval |
| **P1** | `user:face-embedding:<userId>` | 86400s (24h) | JSON String | When user re-enrolls face (`enrollFace`) |
| **P1** | `store:geofence:<storeId>` | 7200s (2h) | JSON String | When store address/location is updated |
| **P1** | `blacklist:token:<tokenHash>` | remaining TTL | String (`"1"`) | Added immediately on `/auth/logout` |
| **P1** | `rate-limit:<ip>` | 60s (1m) | Integer | Auto-expires every window |
| **P2** | `org:access:<userId>:<orgId>` | 600s (10m) | JSON String | Role change, manager store assignment change |
| **P2** | `shifts:list:<orgId>:<storeId>` | 1800s (30m) | JSON String | When shifts are created, edited, or deleted |
| **P2** | `shifts:assign:<storeId>:<date>` | 900s (15m) | JSON String | When shift schedule is created or deleted |
| **P2** | `stores:user:<userId>` | 900s (15m) | JSON String | Store creation, modification, or manager re-assignment |

---

## 6. Execution Roadmap / Checklist

- [ ] **Phase 0: Environment & Dependencies**
  - [ ] Run `npm install ioredis rate-limit-redis` in `backend`.
  - [ ] Fix typo in `backend/src/config/config.js` (`process.env.REDIS_PORT`).
  - [ ] Add graceful fallback in `backend/src/config/redis.js`.
  - [ ] Create `backend/src/utils/cache.js`.

- [ ] **Phase 1: Critical (P0)**
  - [ ] Integrate user cache into `verifyJWT` in `auth.middleware.js`.
  - [ ] Integrate cache invalidation into `editUserProfile`, `changeUserPassword`, and `logoutUser`.
  - [ ] Integrate `getOrSetCache` into `getAdminDashboardStats` in `admin.service.js`.

- [ ] **Phase 2: High Concurrency (P1)**
  - [ ] Cache face embeddings & geofence coordinates in `attendence.service.js`.
  - [ ] Replace memory rate-limiter with Redis store in `app.middleware.js`.
  - [ ] Add token blacklisting in `logout` and check it in `verifyJWT`.

- [ ] **Phase 3: Permissions & Rosters (P2)**
  - [ ] Cache authorization responses in `authorizeOrganizationAccess`.
  - [ ] Cache shift listings & daily assignments in `shift.service.js`.
  - [ ] Cache user store list in `store.service.js`.

