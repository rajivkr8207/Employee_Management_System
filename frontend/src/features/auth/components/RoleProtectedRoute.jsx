import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { normalizeRole, getRoleDashboardPath, ROLES } from "../../../constants/roles";

/**
 * RoleProtectedRoute enforces:
 * 1. User is authenticated
 * 2. User account is active and verified (pending/rejected/suspended redirected to /account-status)
 * 3. User's role is in the allowedRoles list
 */
export default function RoleProtectedRoute({ allowedRoles = [] }) {
    const location = useLocation();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const normalizedUserRole = normalizeRole(user?.role);

    // Check account status
    // Admin role always has access to administrative tools
    const isAdmin = normalizedUserRole === ROLES.ADMIN;
    const status = user?.status || (user?.isApproved === false ? "pending" : (user?.isBlocked ? "suspended" : "verified"));

    if (!isAdmin && (status === "pending" || status === "rejected" || status === "suspended" || user?.isBlocked)) {
        return <Navigate to="/account-status" replace />;
    }

    // Role check
    if (allowedRoles.length > 0) {
        const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
        if (!normalizedAllowed.includes(normalizedUserRole)) {
            // Redirect to their authorized dashboard
            const redirectPath = getRoleDashboardPath(user?.role);
            return <Navigate to={redirectPath} replace />;
        }
    }

    return <Outlet />;
}

