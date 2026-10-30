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

/**
 * useAuth — central hook for all auth operations.
 *
 * Returns:
 *  - user, token, isAuthenticated
 *  - status flags: loginLoading, registerLoading, profileLoading, updateLoading
 *  - errors: loginError, registerError, profileError, updateProfileError
 *  - actions: login(), register(), fetchProfile(), updateProfile(), logout()
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
                navigate("/dashboard", { replace: true });
                return { success: true };
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
                navigate("/dashboard", { replace: true });
                return { success: true };
            }
            return { success: false, error: result.payload };
        },
        [dispatch, navigate]
    );

    /* ── Fetch Profile ── */
    const fetchProfile = useCallback(
        () => dispatch(fetchProfileThunk()),
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

