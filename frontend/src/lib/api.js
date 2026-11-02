import axios from "axios";
import { Config } from "../config/Config";

export const api = axios.create({
    baseURL: `${Config.BACKEND_URL}/api/v1`,
    timeout: 10000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

/* ── Request interceptor: attach stored token automatically ── */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("ems_token");
        if (token && token !== "undefined" && token !== "null") {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/* ── Response interceptor: handle 401 globally ── */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const currentPath = window.location.pathname;
            if (currentPath !== "/login" && currentPath !== "/register") {
                localStorage.removeItem("ems_token");
                localStorage.removeItem("ems_user");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);
