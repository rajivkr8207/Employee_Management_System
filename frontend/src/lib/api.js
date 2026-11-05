import axios from "axios";
import { Config } from "../config/Config";

const baseURL = `${Config.BACKEND_URL}/api/v1`;

export const api = axios.create({
    baseURL,
    timeout: 10000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

let authStore;
let refreshPromise;

export function bindAuthStore(store) {
    authStore = store;
}

api.interceptors.request.use(
    (config) => {
        const token = authStore?.getState().auth.token;
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

function isAuthEndpoint(url = "") {
    return [
        "/auth/login",
        "/auth/register",
        "/auth/store-admin/register",
        "/auth/refresh-token",
    ].some((endpoint) => url.includes(endpoint));
}

function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = axios
            .post(`${baseURL}/auth/refresh-token`, {}, {
                timeout: 10000,
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
            })
            .then(({ data }) => {
                const token = data?.data?.accessToken;
                if (!token) {
                    throw new Error("The refresh response did not contain an access token");
                }
                authStore?.dispatch({ type: "auth/setAccessToken", payload: token });
                return token;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const request = error.config;
        if (
            error.response?.status !== 401 ||
            !request ||
            request._retry ||
            isAuthEndpoint(request.url)
        ) {
            return Promise.reject(error);
        }

        request._retry = true;
        try {
            const token = await refreshAccessToken();
            request.headers = request.headers || {};
            request.headers.Authorization = `Bearer ${token}`;
            return api(request);
        } catch (refreshError) {
            authStore?.dispatch({ type: "auth/clearAuth" });
            if (window.location.pathname !== "/login") {
                window.location.replace("/login");
            }
            return Promise.reject(refreshError);
        }
    }
);
