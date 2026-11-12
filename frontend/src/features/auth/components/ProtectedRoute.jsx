import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { normalizeRole, ROLES } from "../../../constants/roles";

export default function ProtectedRoute() {
    const { isAuthenticated, isInitializing, user } = useSelector((state) => state.auth);

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--text-secondary)]">
                Loading your profile...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const normalizedRole = normalizeRole(user?.role);
    const isAdmin = normalizedRole === ROLES.ADMIN;
    const status = user?.status || (user?.isApproved === false ? "pending" : (user?.isBlocked ? "suspended" : "verified"));

    if (!isAdmin && (status === "pending" || status === "rejected" || status === "suspended" || user?.isBlocked)) {
        return <Navigate to="/account-status" replace />;
    }

    return <Outlet />;
}
