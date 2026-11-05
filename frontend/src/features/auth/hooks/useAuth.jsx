import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import {
    loginThunk,
    registerThunk,
    fetchProfileThunk,
    updateProfileThunk,
    logoutThunk,
} from "../auth.thunk";
import { clearAuth, clearErrors } from "../auth.slice";
import { getRoleDashboardPath } from "../../../constants/roles";

/**
 * useAuth — central hook for all auth operations.
 */
export default function useAuth() {
    const dispatch   = useDispatch();
    const navigate   = useNavigate();

    const auth = useSelector((state) => state.auth);

    /* ── Login ── */
    const login = useCallback(
        async (credentials) => {
            const result = await dispatch(loginThunk(credentials));
            if (loginThunk.fulfilled.match(result)) {
                const userObj = result.payload?.user;
                const targetPath = getRoleDashboardPath(userObj?.role);
                navigate(targetPath, { replace: true });
                return { success: true, user: userObj };
            }
            return { success: false, error: result.payload };
        },
        [dispatch, navigate]
    );

    /* ── Register ── */
    const register = useCallback(
        async (data) => {
            const result = await dispatch(registerThunk(data));
            if (registerThunk.fulfilled.match(result)) {
                const userObj = result.payload?.user;
                // If user is pending approval or not admin, show status page or role dashboard
                if (userObj?.status === 'pending' || userObj?.isApproved === false) {
                    navigate("/account-status", { replace: true });
                } else {
                    const targetPath = getRoleDashboardPath(userObj?.role);
                    navigate(targetPath, { replace: true });
                }
                return { success: true, user: userObj };
            }
            return { success: false, error: result.payload };
        },
        [dispatch, navigate]
    );

    /* ── Fetch Profile ── */
    const fetchProfile = useCallback(
        (options) => dispatch(fetchProfileThunk(options)),
        [dispatch]
    );

    /* ── Update Profile ── */
    const updateProfile = useCallback(
        async (formData) => {
            const result = await dispatch(updateProfileThunk(formData));
            if (updateProfileThunk.fulfilled.match(result)) {
                return { success: true };
            }
            return { success: false, error: result.payload };
        },
        [dispatch]
    );

    /* ── Logout ── */
    const logout = useCallback(
        async () => {
            await dispatch(logoutThunk());
            navigate("/login", { replace: true });
        },
        [dispatch, navigate]
    );

    /* ── Clear local auth (no API call) ── */
    const clearSession = useCallback(
        () => dispatch(clearAuth()),
        [dispatch]
    );

    const clearAllErrors = useCallback(
        () => dispatch(clearErrors()),
        [dispatch]
    );

    return {
        /* state */
        user:            auth.user,
        token:           auth.token,
        isAuthenticated: auth.isAuthenticated,

        /* loading booleans */
        loginLoading:   auth.loginStatus   === "loading",
        registerLoading: auth.registerStatus === "loading",
        profileLoading:  auth.profileStatus  === "loading",
        updateLoading:   auth.updateProfileStatus === "loading",

        /* success flags */
        loginSuccess:   auth.loginStatus   === "succeeded",
        registerSuccess: auth.registerStatus === "succeeded",
        updateSuccess:   auth.updateProfileStatus === "succeeded",

        /* errors */
        loginError:         auth.loginError,
        registerError:      auth.registerError,
        profileError:       auth.profileError,
        updateProfileError: auth.updateProfileError,

        /* actions */
        login,
        register,
        fetchProfile,
        updateProfile,
        logout,
        clearSession,
        clearAllErrors,
    };
}
