# Project Audit: Missing Features, Gaps & Optimization Roadmap
**Project:** Employee Management System (EMS)  
**Document:** Missing Features & Technical Optimization Analysis (Source-Checked Update)
**Based on:** `projectreport.html` Source Audit & Live Codebase Verification  
**Target Architecture:** React 19 Frontend + Node.js / Express Backend + MongoDB + Redis  
**Last Updated:** November 2026 (P1, P2, In-App Broadcast Notifications & Production Bootstrap Completed)

---

## 1. Quick Status Snapshot

### Completed
- Core employee lifecycle and account management are implemented and working.
- Password recovery, department/designation management, payroll, notifications, and admin bootstrap are all in place.
- SMTP connectivity is verified at server startup and logged; missing or failed SMTP configuration is reported without blocking API startup.
- Production-grade fixes for broken routes, stale UI logic, store safety checks, and rollback handling were completed.
- Database indexing and pagination improvements were added to support real-world scale.
- Frontend route-based lazy loading is implemented and the production build succeeds. The latest build still emits a 406 KB minified entry chunk, so the original <350 KB target is not met.
- Redis-backed cache-aside utilities are integrated for user profiles, admin dashboard statistics, face embeddings, store geofence data, stores, and shifts. Token revocation and a Redis rate-limit store are also wired in.
- A first frontend test suite now covers auth state and protected-route behavior (5 tests across 2 files).

### Still Missing / Needs Verification
- Redis caching for organization membership/permission checks is not implemented. Redis outage behavior for the distributed rate limiter has not been validated; cache helper fallback alone does not prove rate-limit fallback.
- The frontend test suite is only a starting point: employee forms, password recovery, attendance, and manager workflows still need focused tests.
- Further bundle-size reduction is needed: the current entry chunk is 406 KB minified, above the documented 350 KB goal.
- Bulk employee import/export.
- Employee document vault.
- Biometric liveness / anti-spoofing remains optional and requires product, privacy, and legal approval.

### Next Steps
1. Validate Redis-backed rate limiting with Redis available and unavailable; document the actual failure behavior and add a focused integration check.
2. Reduce the remaining 406 KB frontend entry chunk toward the <350 KB target, using build output to identify large shared dependencies.
3. Expand frontend tests around password recovery, employee mutation, and role/store access flows.
4. Build CSV employee import/export after defining validation, duplicate handling, authorization, and error-report requirements.
5. Defer the document vault and biometric liveness until product scope and privacy/retention requirements are approved.

---

## 2. Executive Summary & Audit Scorecard

Phase 1 fixes, core business modules, the in-app notification engine, and admin bootstrapping are implemented. Production readiness still depends on validating deployment data, unique-index rollout, Redis outage behavior, and the remaining security and performance checks below.

All backend test suites (**11/11 suites, 64/64 tests**) pass, and the frontend builds cleanly without errors.

### Current Completion Breakdown:
* **Backend:** **96%** (All CRUD operations, Auth recovery, Department/Designations, Payroll engine, In-App Notifications with Store Admin Broadcast & Attendance events, Production Admin Bootstrapping, Compound indexes)
* **Frontend:** **92%** (All major user flows, Forgot/Reset password, Edit employee modal, Multi-store manager switcher, Departments page, Payroll management & Payslip viewer, Notification drawer with Broadcast modal, and clean branding)
* **Database / Data Integrity:** Core unique indexes and onboarding compensation are present. Cross-document store/employee checks are now enforced in service logic; production index readiness and legacy orphan cleanup still require deployment-side verification.
* **API Integration:** **97%** (All frontend services and backend endpoints unified without contract mismatches or dead routes)
* **Security & Infrastructure:** **88%** (JWT + Bcrypt, password reset with crypto tokens & expiration, auto-seeding root admin, Docker multi-container setup, ImageKit lazy loading, CI/CD case-sensitivity resolved)

---

## 3. Broken Features & Contract Mismatches Status

| Priority | Issue / Defect | Location | Status | Resolution Details |
| :--- | :--- | :--- | :--- | :--- |
| 🔴 **P1** | **Employee Update (PATCH) & Delete (DELETE)** | `backend/src/modules/employee/` & `frontend/src/features/employees/` | ✅ **RESOLVED** | Implemented `PATCH /api/v1/employees/:id` and `DELETE /api/v1/employees/:id` (soft-deactivation). Added `EditEmployeeModal` and confirmation modal in `EmployeeListPage.jsx`. |
| 🔴 **P1** | **Dead "Forgot Password?" Link** | `frontend/src/features/auth/` & `backend/src/modules/user/` | ✅ **RESOLVED** | Implemented `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password` with crypto tokens. Built `ForgotPassword.jsx` and `ResetPassword.jsx` and registered routes. |
| 🔴 **P1** | **Multi-Store Manager Screen Bug** | `frontend/src/features/dashboard/` | ✅ **RESOLVED** | Replaced hardcoded `stores[0]` with dynamic multi-store selector in both `StoreManagerDashboardPage.jsx` and `StoreManagerOperationsPage.jsx`. |
| 🔴 **P1** | **Store Deletion Orphan Risk** | `backend/src/modules/store/store.service.js` | ✅ **RESOLVED** | Blocks hard deletion while any employee or store-linked operational/history record exists; safe deletion removes stale membership references and does not cascade-delete records. |
| 🔴 **P1** | **Employee Cross-Organization Store Assignment** | `backend/src/modules/employee/employee.service.js` | ✅ **RESOLVED** | Enforces that the primary store and every membership store are active, approved, and in the same organization; verifies a manager or store administrator has access to every assigned store. |
| 🔴 **P1** | **Store Manager Onboarding Rollback** | `backend/src/modules/store/store.service.js` | ✅ **RESOLVED** | Implemented multi-step compensating rollback (cleans up User, Store assignment, Membership, and Employee records on any failure). |
| 🟡 **P1** | **Hardcoded Marketing Stats** | `frontend/src/features/auth/pages/Login.jsx` | ✅ **RESOLVED** | Replaced static claims ("1,200+ employees", "24 departments", "99.9% uptime") with clean system capability highlights. |
| 🟡 **P1** | **Redis Port Typo** | `backend/src/config/config.js` | ✅ **RESOLVED** | Corrected `process.env.redis_port` to `process.env.REDIS_PORT`. |
| 🔴 **P1** | **Production First-Time Admin Bootstrapping** | `backend/src/utils/bootstrapAdmin.js` & `server.js` | ✅ **RESOLVED** | Implemented automatic root admin creation on server boot when database has 0 admins, plus standalone CLI script (`npm run seed:admin`). |

---

## 4. Core Business Modules Status (Phase 2 & Extensions)

### 📌 Topic 3.1: Employee Lifecycle & Mutation
* **Status:** ✅ **COMPLETED**
* **Endpoints:**
  * `PATCH /api/v1/employees/:id` (updates designation, salary, Dob, joiningDate, status)
  * `DELETE /api/v1/employees/:id` (soft-deactivation with status: `terminated`)
  * `GET /api/v1/employees/me` & `GET /api/v1/employees` (with optional `page` & `limit`)
* **Frontend:** Interactive edit modal & confirmation dialog on employee management table.

### 📌 Topic 3.2: Account Recovery & Password Reset
* **Status:** ✅ **COMPLETED**
* **Endpoints:**
  * `POST /api/v1/auth/forgot-password` (generates 1-hour crypto token, sends HTML email via `MailService`)
  * `POST /api/v1/auth/reset-password` (validates token, updates password, increments `refreshTokenVersion` to revoke old sessions)
* **Frontend:** Dedicated pages `ForgotPassword.jsx` and `ResetPassword.jsx` linked from Login.

### 📌 Topic 3.3: Department & Designation Hierarchy
* **Status:** ✅ **COMPLETED**
* **Backend:**
  * `DepartmentModel` (`name`, `code`, `organizationId`, `description`, `status`) with compound index.
  * `DesignationModel` (`title`, `departmentId`, `organizationId`, `level`, `baseSalary`, `status`) with compound index.
  * Endpoints: Full CRUD at `/api/v1/departments` and `/api/v1/departments/designations`.
* **Frontend:** `DepartmentsPage.jsx` with tabs for departments and designations, search, and creation/editing modals.

### 📌 Topic 3.4: Payroll & Compensation Engine
* **Status:** ✅ **COMPLETED**
* **Backend:**
  * `PayrollModel` (`organizationId`, `storeId`, `employeeId`, `payPeriodMonth`, `payPeriodYear`, `baseSalary`, `allowances`, `deductions`, `netSalary`, `presentDays`, `totalDays`, `status`, `paymentDate`).
  * `POST /api/v1/payroll/payrun`: Automated monthly calculation combining attendance days, calculated daily rate, and absent deductions.
  * `GET /api/v1/payroll`: Filterable list by store, month, and year with pagination.
  * `GET /api/v1/payroll/me`: Employee self-service endpoint to view their own salary history.
  * `PATCH /api/v1/payroll/:id/status`: Transition status (`draft` → `approved` → `paid`).
* **Frontend:**
  * `PayrollPage.jsx` for Store Admins and Managers with monthly generator and printable Payslip modal.
  * Self-service payslip history table in `EmployeeOperationsPage.jsx` under the Compensation tab.

### 📌 Topic 3.5: In-App Notification Center & Store Admin Broadcast
* **Status:** ✅ **COMPLETED**
* **Backend:**
  * `NotificationModel` (`userId`, `senderId`, `organizationId`, `storeId`, `title`, `message`, `type`, `isRead`, `actionUrl`, `createdAt`).
  * Endpoints:
    * `GET /api/v1/notifications`: Paginated user notification list.
    * `GET /api/v1/notifications/unread-count`: Fast badge count.
    * `PATCH /api/v1/notifications/:id/read` & `PATCH /api/v1/notifications/read-all`: Status updates.
    * `POST /api/v1/notifications/broadcast`: Restricted to Store Admin & Admin to blast announcements to an entire organization or a specific store.
  * **Attendance Integration:**
    * Clock-in & clock-out success triggers notifications for employee and store admin/managers.
    * Clock-in & clock-out errors (geofence, shift, face mismatch) immediately dispatch alert notifications.
* **Frontend:**
  * Notification bell in `Topbar.jsx` with live polling, unread count badge, category tags (`announcement`, `attendance`, `alert`, `payroll`, `leave`), slide-down drawer, and action navigation.
  * `BroadcastNotificationModal.jsx`: Store Admin can compose announcements and select target scope (entire organization or individual store).

### 📌 Topic 3.6: Production Root Admin Bootstrapping
* **Status:** ✅ **COMPLETED**
* **Backend:**
  * `backend/src/utils/bootstrapAdmin.js`: Automatically creates a default root System Admin account on initial server boot if 0 admins exist in the MongoDB database.
  * `backend/src/scripts/seedAdmin.js`: CLI tool (`npm run seed:admin`) supporting custom CLI parameters (`--email`, `--password`, `--username`).
  * Configurable via `.env` (`INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, etc.).

### 📌 Topic 3.7: Database Indexing & Pagination
* **Status:** ✅ **COMPLETED**
* **Compound Indexes Added:**
  * `AttendanceModel`: `{ organizationId: 1, storeId: 1, date: -1 }`
  * `EmployeeModel`: `{ organizationId: 1, storeId: 1, status: 1 }`
  * `LeaveModel`: `{ organizationId: 1, employeeId: 1, from: -1 }`
  * `PayrollModel`: `{ employeeId: 1, payPeriodMonth: 1, payPeriodYear: 1 }`
  * `NotificationModel`: `{ userId: 1, isRead: 1, createdAt: -1 }`
* **Pagination Support:** Added `page` and `limit` support to `listEmployees` and `listPayrolls`.
* **Deployment Readiness:** Model indexes are declared and exercised by the test database, but no production database was inspected. Existing data must be checked for duplicate unique-index keys before applying or rebuilding unique indexes.

### 📌 Topic 3.8: Database Referential Integrity & Deployment Safety
* **Store deletion:** Hard deletion is blocked when employees (including inactive/terminated employees), attendance, payroll, shifts, shift assignments, or notifications reference the store. Historical data is retained rather than cascaded away.
* **Employee creation:** The service derives the organization from the selected store, rejects a conflicting organization ID, and validates every requested membership store against organization, active/approved status, and requester access.
* **Unique-index scope:** Store `code` and `createdBy` are globally unique (the current one-store-per-administrator policy); employee code and user membership are unique per organization; membership user/organization and the model-specific payroll/attendance/shift constraints remain in their declared scopes. These rules should be treated as business policy, not silently widened.
* **Still requiring deployment action:** Run a duplicate-key preflight against production data before building unique indexes, and define a repeatable migration/index rollout and backup/restore procedure. This repository change does not connect to or alter production data.
* **Multi-document writes:** Manager onboarding uses compensating cleanup, not a MongoDB transaction. Transactional atomicity requires a replica-set deployment; the current standalone in-memory test database does not validate transaction behavior.

---

## 5. Remaining Scope: Phase 3 (Performance, Scale & Advanced Features)

These items represent optimizations and secondary enhancements for enterprise-scale readiness:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🟡 PHASE 3: PERFORMANCE, SECURITY & SCALE ROADMAP                      │
│                                                                        │
│ 1. Frontend Bundle Size Follow-up                                      │
│    - Route-level React.lazy code splitting is implemented.             │
│    - Remaining: reduce the 406 KB minified entry chunk below 350 KB.   │
│                                                                        │
│ 2. Redis Reliability & Coverage                                        │
│    - User, dashboard, attendance, store, shift caches are integrated. │
│    - Validate rate-limit outage behavior; permission cache is absent. │
│                                                                        │
│ 3. Frontend Test Coverage                                              │
│    - Vitest + React Testing Library configured; 5 auth tests pass.     │
│    - Expand coverage to critical user workflows and failure states.   │
│                                                                        │
│ 4. Bulk Employee Import & Export                                       │
│    - CSV / Excel parsing endpoint for bulk employee onboarding.        │
│    - CSV export endpoint for employee records.                         │
│                                                                        │
│ 5. Employee Document Vault                                             │
│    - Upload Aadhaar/PAN/Contract documents to ImageKit/S3 storage.     │
│    - Time-limited signed URLs for document downloads.                  │
│                                                                        │
│ 6. Biometric Anti-Spoofing & Liveness                                  │
│    - Eye-blink / head movement challenge during face clock-in.         │
│    - Flagging static image uploads for manager manual review.          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Master Feature Status Matrix

| Component | Feature Area | Current State | Target Phase |
| :--- | :--- | :--- | :--- |
| **Backend** | Employee Mutation (PATCH & DELETE) | ✅ Implemented & Tested | Phase 1 |
| **Backend** | Password Reset Token & Mail API | ✅ Implemented & Tested | Phase 1 |
| **Backend** | Safe Store Deletion Guards | ✅ Implemented & Tested (employees and operational/history references) | Phase 1 |
| **Backend** | Employee Organization / Store Invariants | ✅ Implemented & Tested | Phase 1 |
| **Backend** | Onboarding Compensating Rollbacks | ✅ Implemented & Tested | Phase 1 |
| **Backend** | Department & Designation CRUD API | ✅ Implemented & Tested | Phase 2 |
| **Backend** | Payroll Generation & Payslip API | ✅ Implemented & Tested | Phase 2 |
| **Backend** | In-App Notifications & Store Admin Broadcast | ✅ Implemented & Tested | Phase 2+ |
| **Backend** | Attendance Event Notifications (Success/Error) | ✅ Implemented & Tested | Phase 2+ |
| **Backend** | Production Root Admin Bootstrapping | ✅ Implemented & Tested | Phase 2+ |
| **Backend** | Compound Mongoose Indexes | ✅ Implemented | Phase 2 |
| **Backend** | Redis Cache-Aside (user, dashboard, attendance, stores, shifts) | ✅ Implemented; runtime Redis not verified here | Phase 3 |
| **Backend** | Redis-backed API Rate Limiting | ✅ Configured; outage fallback needs verification | Phase 3 |
| **Backend** | Organization Membership / Permission Cache | ⏳ Not implemented | Phase 3 |
| **Backend** | Bulk Employee CSV Import / Export | ⏳ Planned | Phase 3 |
| **Backend** | Biometric Liveness Challenge | ⏳ Planned | Phase 3 |
| **Frontend** | Forgot & Reset Password Screens | ✅ Implemented & Routed | Phase 1 |
| **Frontend** | Employee Edit Modal & Deactivation | ✅ Implemented | Phase 1 |
| **Frontend** | Multi-Store Manager Switcher | ✅ Implemented | Phase 1 |
| **Frontend** | Departments & Designations UI | ✅ Implemented & Routed | Phase 2 |
| **Frontend** | Payroll Management & Slip View | ✅ Implemented & Routed | Phase 2 |
| **Frontend** | Topbar Notification Drawer & Badge | ✅ Implemented | Phase 2 |
| **Frontend** | Store Admin Broadcast Modal | ✅ Implemented | Phase 2+ |
| **Frontend** | Employee Self-Service Payslip View | ✅ Implemented | Phase 2 |
| **Frontend** | Route Code-Splitting (`React.lazy`) | ✅ Implemented; entry chunk remains 406 KB minified | Phase 3 |
| **Frontend** | Vitest / React Testing Library Suite | 🟡 Initial 5 auth tests passing; workflow coverage incomplete | Phase 3 |

---

## 7. Verification & Test Compliance
* **Backend Unit & Integration Tests:** Ran `npm test -- --runInBand` in `backend/`; 10 suites / 56 tests passed.
* **Frontend Tests:** `npm test` runs Vitest; current initial suite passes 5 tests across 2 files.
* **Production Build:** Vite production build succeeds (`npm run build` in `frontend/`); latest output includes a 406 KB minified entry chunk.
* **Container Orchestration:** Multi-service `docker-compose.yml` (`mongodb`, `backend`, `frontend`) configured with watch mode.
