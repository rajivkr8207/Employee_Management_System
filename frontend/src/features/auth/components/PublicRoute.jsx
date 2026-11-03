import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { getRoleDashboardPath } from "../../../constants/roles";

export default function PublicRoute() {
    const { isAuthenticated, user } = useSelector(
        (state) => state.auth
    );

    if (isAuthenticated) {
        const redirectPath = getRoleDashboardPath(user?.role);
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
}
