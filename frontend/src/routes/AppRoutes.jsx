import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Layout
import AppLayout from "../components/layout/AppLayout";

// Auth pages & guards
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Profile from "../features/auth/pages/Profile";
import AccountStatusPage from "../features/auth/pages/AccountStatusPage";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import PublicRoute from "../features/auth/components/PublicRoute";
import RoleProtectedRoute from "../features/auth/components/RoleProtectedRoute";

// Roles
import { ROLES, getRoleDashboardPath } from "../constants/roles";

// Dashboards
import AdminDashboardPage from "../features/dashboard/pages/AdminDashboardPage";
import StoreAdminDashboardPage from "../features/dashboard/pages/StoreAdminDashboardPage";
import StoreManagerDashboardPage from "../features/dashboard/pages/StoreManagerDashboardPage";
import EmployeeDashboardPage from "../features/dashboard/pages/EmployeeDashboardPage";

// Operations & Sub-pages
import StoreAdminOperationsPage from "../features/dashboard/pages/StoreAdminOperationsPage";
import StoreManagerOperationsPage from "../features/dashboard/pages/StoreManagerOperationsPage";
import EmployeeOperationsPage from "../features/dashboard/pages/EmployeeOperationsPage";

// Admin Verification pages
import UserVerificationPage from "../features/userVerification/pages/UserVerificationPage";
import StoreVerificationPage from "../features/storeVerification/pages/StoreVerificationPage";
import ManagerVerificationPage from "../features/managerVerification/pages/ManagerVerificationPage";

// Admin Management pages
import AllUsersPage from "../features/admin/pages/AllUsersPage";
import AllStoresPage from "../features/admin/pages/AllStoresPage";
import AllEmployeesPage from "../features/admin/pages/AllEmployeesPage";
import ReportsAnalyticsPage from "../features/admin/pages/ReportsAnalyticsPage";
import ActivityLogsPage from "../features/admin/pages/ActivityLogsPage";

// Common
import NotFoundPage from "../components/Common/NotFoundPage";

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
        <Routes>
            {/* ── Public Routes (redirect to role dashboard if authenticated) ── */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
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
                        <Route path="/admin/user-verification" element={<UserVerificationPage />} />
                        <Route path="/admin/store-verification" element={<StoreVerificationPage />} />
                        <Route path="/admin/manager-verification" element={<ManagerVerificationPage />} />
                        <Route path="/admin/users" element={<AllUsersPage />} />
                        <Route path="/admin/stores" element={<AllStoresPage />} />
                        <Route path="/admin/employees" element={<AllEmployeesPage />} />
                        <Route path="/admin/analytics" element={<ReportsAnalyticsPage />} />
                        <Route path="/admin/activity-logs" element={<ActivityLogsPage />} />
                    </Route>

                    {/* ── STORE ADMIN ROUTES ── */}
                    <Route element={<RoleProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN]} />}>
                        <Route path="/store-admin/dashboard" element={<StoreAdminDashboardPage />} />
                        <Route path="/store-admin/stores" element={<StoreAdminOperationsPage activeSection="stores" />} />
                        <Route path="/store-admin/managers" element={<StoreAdminOperationsPage activeSection="managers" />} />
                        <Route path="/store-admin/employees" element={<StoreAdminOperationsPage activeSection="employees" />} />
                        <Route path="/store-admin/attendance" element={<StoreAdminOperationsPage activeSection="attendance" />} />
                        <Route path="/store-admin/leaves" element={<StoreAdminOperationsPage activeSection="leaves" />} />
                    </Route>

                    {/* ── STORE MANAGER ROUTES ── */}
                    <Route element={<RoleProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.MANAGER]} />}>
                        <Route path="/store-manager/dashboard" element={<StoreManagerDashboardPage />} />
                        <Route path="/store-manager/employees" element={<StoreManagerOperationsPage activeSection="employees" />} />
                        <Route path="/store-manager/attendance" element={<StoreManagerOperationsPage activeSection="attendance" />} />
                        <Route path="/store-manager/leaves" element={<StoreManagerOperationsPage activeSection="leaves" />} />
                        <Route path="/store-manager/shifts" element={<StoreManagerOperationsPage activeSection="shifts" />} />
                    </Route>

                    {/* ── EMPLOYEE ROUTES ── */}
                    <Route element={<RoleProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]} />}>
                        <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
                        <Route path="/employee/attendance" element={<EmployeeOperationsPage activeSection="attendance" />} />
                        <Route path="/employee/leaves" element={<EmployeeOperationsPage activeSection="leaves" />} />
                        <Route path="/employee/salary" element={<EmployeeOperationsPage activeSection="salary" />} />
                    </Route>

                </Route>
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
