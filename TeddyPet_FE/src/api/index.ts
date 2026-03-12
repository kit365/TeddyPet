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

        // Check if this is a public booking API
        const isBookingPublicApi =
            !isAdmin &&
            (config.url?.includes('/api/service-categories') ||
                config.url?.includes('/api/services') ||
                config.url?.includes('/api/service-pricings') ||
                config.url?.includes('/api/room-layout-configs') ||
                config.url?.includes('/api/rooms') ||
                config.url?.includes('/api/room-types') ||
                config.url?.includes('/api/bookings') || // This includes /api/bookings/deposit-intent and /api/bookings/code/
                config.url?.includes('/api/bookings/code/') || // Specific booking detail endpoint
                config.url?.includes('/api/time-slots') ||
                config.url?.includes('/api/bank-information') ||
                config.url?.includes('/api/banks') ||
                config.url?.includes('/api/booking-deposit-refund-policies') ||
                config.url?.includes('/api/settings') ||
                config.url?.includes('/api/otp') ||
                config.url?.includes('/api/orders') ||
                config.url?.includes('/api/carts') ||
                config.url?.includes('/api/feedbacks') ||
                config.url?.includes('/api/home') ||
                config.url?.includes('/api/blog'));

        // Only add authorization header if token exists and it's not a public API that should work without auth
        if (token && !isBookingPublicApi) {
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

            // Optional auth check: allow public pages to load without redirecting to login
            // Example: booking detail page is public; app may call /api/auth/me on refresh to hydrate user state.
            const isOptionalAuthApi = !isAdmin && (originalRequest.url?.includes('/api/auth/me') || false);

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
            // để khách vãng lai có thể đặt lịch mà không bắt buộc đăng nhập
            const isBookingPublicApi =
                !isAdmin &&
                (originalRequest.url?.includes('/api/service-categories') ||
                    originalRequest.url?.includes('/api/services') ||
                    originalRequest.url?.includes('/api/service-pricings') ||
                    originalRequest.url?.includes('/api/room-layout-configs') ||
                    originalRequest.url?.includes('/api/rooms') ||
                    originalRequest.url?.includes('/api/room-types') ||
                    originalRequest.url?.includes('/api/bookings') || // This includes /api/bookings/deposit-intent and /api/bookings/code/
                    originalRequest.url?.includes('/api/bookings/code/') || // Specific booking detail endpoint
                    originalRequest.url?.includes('/api/time-slots') ||
                    originalRequest.url?.includes('/api/bank-information') ||
                    originalRequest.url?.includes('/api/banks') ||
                    originalRequest.url?.includes('/api/booking-deposit-refund-policies') ||
                    originalRequest.url?.includes('/api/settings') ||
                    originalRequest.url?.includes('/api/otp') ||
                    originalRequest.url?.includes('/api/orders') ||
                    originalRequest.url?.includes('/api/carts') ||
                    originalRequest.url?.includes('/api/feedbacks') ||
                    originalRequest.url?.includes('/api/home') ||
                    originalRequest.url?.includes('/api/blog'));

            if (!refreshToken) {
                if (isBookingPublicApi || isOptionalAuthApi) {
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
                
                // For public booking APIs, don't redirect even if refresh fails
                if (isBookingPublicApi || isOptionalAuthApi) {
                    isRefreshing = false;
                    return Promise.reject(err);
                }
                
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