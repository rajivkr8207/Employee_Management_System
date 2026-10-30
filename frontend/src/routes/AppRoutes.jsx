import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import AppLayout from "../components/layout/AppLayout";

// Auth pages
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Profile from "../features/auth/pages/Profile";

// Route Guards
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import PublicRoute from "../features/auth/components/PublicRoute";

// Dashboard
// import DashboardPage from "../features/dashboard/pages/DashboardPage";

// Common
import NotFoundPage from "../components/Common/NotFoundPage";

export default function AppRoutes() {
    return (
        <Routes>
            {/* ── Public Routes (redirect to dashboard if already logged in) ── */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Route>

            {/* ── Protected Routes (redirect to /login if not authenticated) ── */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>

                    {/* Default redirect */}
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* Dashboard */}
                    <Route path="/dashboard" element={<p>dashboard is ready</p>} />

                    {/* Profile */}
                    <Route path="/profile" element={<Profile />} />

                    {/* Employees */}
                    {/* <Route path="/employees"           element={<EmployeesPage />} />
                    <Route path="/employees/add"       element={<AddEmployeePage />} />
                    <Route path="/employees/:id"       element={<EmployeeDetailPage />} />
                    <Route path="/employees/edit/:id"  element={<EditEmployeePage />} /> */}

                    {/* Departments */}
                    {/* <Route path="/departments" element={<DepartmentsPage />} /> */}

                    {/* Attendance */}
                    {/* <Route path="/attendance" element={<AttendancePage />} /> */}

                    {/* Leave */}
                    {/* <Route path="/leave" element={<LeavePage />} /> */}

                    {/* Payroll */}
                    {/* <Route path="/payroll" element={<PayrollPage />} /> */}

                    {/* Settings */}
                    {/* <Route path="/settings" element={<SettingsPage />} /> */}

                </Route>
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
