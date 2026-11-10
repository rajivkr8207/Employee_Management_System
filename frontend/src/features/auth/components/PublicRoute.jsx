import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getRoleDashboardPath } from "../../../constants/roles";

export default function PublicRoute() {
    const { isAuthenticated, user } = useSelector(
        (state) => state.auth
    );
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // If accessing registration with an invitation token, allow access without redirecting
    const hasInvitationToken = location.pathname === "/register" && searchParams.get("token");

    if (isAuthenticated && !hasInvitationToken) {
        const redirectPath = getRoleDashboardPath(user?.role);
        if (redirectPath && redirectPath !== "/login") {
            return <Navigate to={redirectPath} replace />;
        }
    }

    return <Outlet />;
}
