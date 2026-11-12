import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Auth pages & guards
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import PublicRoute from "../features/auth/components/PublicRoute";
import RoleProtectedRoute from "../features/auth/components/RoleProtectedRoute";

// Roles
import { ROLES, getRoleDashboardPath } from "../constants/roles";

// Common fallback
const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
    Loading page...
  </div>
);

const AppLayout = lazy(() => import("../components/layout/AppLayout"));

const Login = lazy(() => import("../features/auth/pages/Login"));
const Register = lazy(() => import("../features/auth/pages/Register"));
const ForgotPassword = lazy(() => import("../features/auth/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../features/auth/pages/ResetPassword"));
const Profile = lazy(() => import("../features/auth/pages/Profile"));
const AccountStatusPage = lazy(() => import("../features/auth/pages/AccountStatusPage"));

const AdminDashboardPage = lazy(() => import("../features/dashboard/pages/AdminDashboardPage"));
const StoreAdminDashboardPage = lazy(() =>
  import("../features/dashboard/pages/StoreAdminDashboardPage"),
);
const StoreManagerDashboardPage = lazy(() =>
  import("../features/dashboard/pages/StoreManagerDashboardPage"),
);
const EmployeeDashboardPage = lazy(() =>
  import("../features/dashboard/pages/EmployeeDashboardPage"),
);

const StoreAdminOperationsPage = lazy(() =>
  import("../features/dashboard/pages/StoreAdminOperationsPage"),
);
const StoreManagerOperationsPage = lazy(() =>
  import("../features/dashboard/pages/StoreManagerOperationsPage"),
);
const EmployeeOperationsPage = lazy(() =>
  import("../features/dashboard/pages/EmployeeOperationsPage"),
);
const ShiftSchedulePage = lazy(() => import("../features/shift/pages/ShiftSchedulePage"));

const StoreListPage = lazy(() => import("../features/store/pages/StoreListPage"));
const EmployeeListPage = lazy(() => import("../features/employees/pages/EmployeeListPage"));
const DepartmentsPage = lazy(() => import("../features/departments/pages/DepartmentsPage"));
const PayrollPage = lazy(() => import("../features/payroll/pages/PayrollPage"));
const InviteStoreAdminPage = lazy(() => import("../features/admin/pages/InviteStoreAdminPage"));
const OrganizationProfilePage = lazy(() =>
  import("../features/organization/pages/OrganizationProfilePage"),
);
const OrganizationVerificationPage = lazy(() =>
  import("../features/organization/pages/OrganizationVerificationPage"),
);

const UserVerificationPage = lazy(() =>
  import("../features/userVerification/pages/UserVerificationPage"),
);
const StoreVerificationPage = lazy(() =>
  import("../features/storeVerification/pages/StoreVerificationPage"),
);
const ManagerVerificationPage = lazy(() =>
  import("../features/managerVerification/pages/ManagerVerificationPage"),
);

const AllUsersPage = lazy(() => import("../features/admin/pages/AllUsersPage"));
const AllStoresPage = lazy(() => import("../features/admin/pages/AllStoresPage"));
const AllEmployeesPage = lazy(() => import("../features/admin/pages/AllEmployeesPage"));
const ReportsAnalyticsPage = lazy(() => import("../features/admin/pages/ReportsAnalyticsPage"));
const ActivityLogsPage = lazy(() => import("../features/admin/pages/ActivityLogsPage"));

const NotFoundPage = lazy(() => import("../components/Common/NotFoundPage"));

/**
 * Dynamically redirects to user's assigned role dashboard
 */
function DashboardRedirect() {
  const { user } = useSelector((state) => state.auth);
  const target = getRoleDashboardPath(user?.role);
  return <Navigate to={target} replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public Routes (redirect to role dashboard if authenticated) ── */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* ── Account Status Route (Pending / Rejected / Suspended) ── */}
        <Route path="/account-status" element={<AccountStatusPage />} />

        {/* ── Protected Routes under AppLayout ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Dynamic root & dashboard redirection */}
            <Route index element={<DashboardRedirect />} />
            <Route path="/" element={<DashboardRedirect />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Common Protected Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Profile />} />

            {/* ── ADMIN ONLY ROUTES ── */}
            <Route element={<RoleProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/invite-store-admin" element={<InviteStoreAdminPage />} />
              <Route
                path="/admin/organization-verification"
                element={<OrganizationVerificationPage />}
              />
              <Route path="/admin/user-verification" element={<UserVerificationPage />} />
              <Route path="/admin/store-verification" element={<StoreVerificationPage />} />
              <Route path="/admin/manager-verification" element={<ManagerVerificationPage />} />
              <Route path="/admin/users" element={<AllUsersPage />} />
              <Route path="/admin/stores" element={<AllStoresPage />} />
              <Route path="/admin/employees" element={<AllEmployeesPage />} />
              <Route path="/admin/departments" element={<DepartmentsPage />} />
              <Route path="/admin/payroll" element={<PayrollPage />} />
              <Route path="/admin/analytics" element={<ReportsAnalyticsPage />} />
              <Route path="/admin/activity-logs" element={<ActivityLogsPage />} />
            </Route>

            {/* ── STORE ADMIN ROUTES ── */}
            <Route element={<RoleProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN]} />}>
              <Route path="/store-admin/dashboard" element={<StoreAdminDashboardPage />} />
              <Route path="/store-admin/organization" element={<OrganizationProfilePage />} />
              <Route path="/store-admin/stores" element={<StoreListPage />} />
              <Route
                path="/store-admin/managers"
                element={<StoreAdminOperationsPage activeSection="managers" />}
              />
              <Route path="/store-admin/employees" element={<EmployeeListPage />} />
              <Route path="/store-admin/departments" element={<DepartmentsPage />} />
              <Route path="/store-admin/payroll" element={<PayrollPage />} />
              <Route path="/store-admin/shifts" element={<ShiftSchedulePage />} />
              <Route
                path="/store-admin/attendance"
                element={<StoreAdminOperationsPage activeSection="attendance" />}
              />
              <Route
                path="/store-admin/leaves"
                element={<StoreAdminOperationsPage activeSection="leaves" />}
              />
            </Route>

            {/* ── STORE MANAGER ROUTES ── */}
            <Route
              element={
                <RoleProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.MANAGER]} />
              }
            >
              <Route path="/store-manager/dashboard" element={<StoreManagerDashboardPage />} />
              <Route path="/store-manager/employees" element={<EmployeeListPage />} />
              <Route path="/store-manager/payroll" element={<PayrollPage />} />
              <Route
                path="/store-manager/attendance"
                element={<StoreManagerOperationsPage activeSection="attendance" />}
              />
              <Route
                path="/store-manager/leaves"
                element={<StoreManagerOperationsPage activeSection="leaves" />}
              />
              <Route path="/store-manager/shifts" element={<ShiftSchedulePage />} />
            </Route>

            {/* ── EMPLOYEE ROUTES ── */}
            <Route
              element={
                <RoleProtectedRoute
                  allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}
                />
              }
            >
              <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
              <Route
                path="/employee/attendance"
                element={<EmployeeOperationsPage activeSection="attendance" />}
              />
              <Route
                path="/employee/leaves"
                element={<EmployeeOperationsPage activeSection="leaves" />}
              />
              <Route
                path="/employee/salary"
                element={<EmployeeOperationsPage activeSection="salary" />}
              />
            </Route>
          </Route>
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
