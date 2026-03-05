import axios from "axios"
import Cookies from "js-cookie"
import { useAuthStore } from "../stores/useAuthStore"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080"

let isRefreshing = false
const failedQueue: { resolve: (value: string | null) => void; reject: (err?: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error)
        else prom.resolve(token)
    })
    failedQueue.length = 0
}

const apiApp = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
})

apiApp.interceptors.request.use(
    (config) => {
        const isAdmin = window.location.pathname.startsWith("/admin");
        const token = isAdmin ? Cookies.get("tokenAdmin") : Cookies.get("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiApp.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response && error.response.data && (error.response.data.message || error.response.data.error)) {
            error.message = error.response.data.message || error.response.data.error;
        }

        const originalRequest = error.config;

        if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {

            const isAdmin = window.location.pathname.startsWith("/admin");
            const tokenKey = isAdmin ? "tokenAdmin" : "token";
            const refreshTokenKey = isAdmin ? "refreshTokenAdmin" : "refreshToken";
            const loginPath = isAdmin ? "/admin/auth/login" : "/auth/login";

            if (originalRequest.url.includes('/login') || originalRequest.url.includes('/refresh-token')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return apiApp(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            const refreshToken = Cookies.get(refreshTokenKey);

            // Không redirect sang login khi 401 từ API đặt lịch (public booking APIs)
            // để khách có thể xem trang đặt lịch mà không bắt buộc đăng nhập
            const isBookingPublicApi =
                !isAdmin &&
                (originalRequest.url?.includes('/api/service-categories') ||
                    originalRequest.url?.includes('/api/services') ||
                    originalRequest.url?.includes('/api/service-pricings') ||
                    originalRequest.url?.includes('/api/room-layout-configs') ||
                    originalRequest.url?.includes('/api/rooms') ||
                    originalRequest.url?.includes('/api/bookings'));

            if (!refreshToken) {
                if (isBookingPublicApi) {
                    return Promise.reject(error);
                }
                if (isAdmin) {
                    Cookies.remove(tokenKey);
                    Cookies.remove(refreshTokenKey);
                } else {
                    useAuthStore.getState().logout();
                }
                processQueue(error, null);
                isRefreshing = false;
                if (window.location.pathname !== loginPath) {
                    window.location.href = loginPath;
                }
                return Promise.reject(error);
            }

            isRefreshing = true;
            try {
                const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
                    refreshToken: refreshToken
                });

                const { token, refreshToken: newRefreshToken } = response.data.data;

                Cookies.set(tokenKey, token);
                if (newRefreshToken) {
                    Cookies.set(refreshTokenKey, newRefreshToken);
                }

                apiApp.defaults.headers.common['Authorization'] = 'Bearer ' + token;
                originalRequest.headers['Authorization'] = 'Bearer ' + token;

                processQueue(null, token);
                return apiApp(originalRequest);

            } catch (err) {
                processQueue(err, null);
                if (isAdmin) {
                    Cookies.remove(tokenKey);
                    Cookies.remove(refreshTokenKey);
                } else {
                    useAuthStore.getState().logout();
                }
                if (window.location.pathname !== loginPath) {
                    window.location.href = loginPath;
                }
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export { apiApp }