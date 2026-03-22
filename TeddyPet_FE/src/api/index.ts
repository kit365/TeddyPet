import axios from "axios"
import Cookies from "js-cookie"
import { useAuthStore } from "../stores/useAuthStore"
import { redirectToLogin } from "../navigationHelper"

const BASE_URL = import.meta.env.VITE_API_URL || ""

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

/** Chỉ các endpoint bank dành cho khách/booking; KHÔNG gồm /bank-information/me (cần JWT khách). */
function isBankInformationGuestPublicUrl(url: string | undefined): boolean {
    if (!url) return false;
    return (
        url.includes("/api/bank-information/booking/code/") ||
        url.includes("/api/bank-information/guest-by-email") ||
        (url.includes("/api/bank-information/order/") && !url.includes("/me"))
    );
}

apiApp.interceptors.request.use(
    (config) => {
        const isAdmin = window.location.pathname.startsWith("/admin");
        let token = isAdmin ? Cookies.get("tokenAdmin") : Cookies.get("token");

        // Cookie token có thể mất (xóa tay / trình duyệt) nhưng Zustand persist còn — khách vẫn thấy đã đăng nhập
        if (!token && !isAdmin) {
            const { user: u, token: storeToken } = useAuthStore.getState();
            const role = (u?.role ?? "").toUpperCase();
            const isStaffOrAdmin = role.includes("ADMIN") || role.includes("STAFF");
            if (storeToken && !isStaffOrAdmin) {
                token = storeToken;
                Cookies.set("token", storeToken, { expires: 1, sameSite: "lax", secure: false });
            }
        }

        // Only add authorization header if token exists and it's not already set
        if (token && !config.headers.Authorization) {
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
                    isBankInformationGuestPublicUrl(originalRequest.url) ||
                    originalRequest.url?.includes('/api/banks') ||
                    originalRequest.url?.includes('/api/booking-deposit-refund-policies') ||
                    originalRequest.url?.includes('/api/settings') ||
                    originalRequest.url?.includes('/api/otp') ||
                    originalRequest.url?.includes('/api/orders') ||
                    originalRequest.url?.includes('/api/carts') ||
                    originalRequest.url?.includes('/api/feedbacks') ||
                    originalRequest.url?.includes('/api/home') ||
                    originalRequest.url?.includes('/api/blog') ||
                    originalRequest.url?.includes('/api/products') ||
                    originalRequest.url?.includes('/api/categories') ||
                    originalRequest.url?.includes('/api/brands') ||
                    originalRequest.url?.includes('/api/tags') ||
                    originalRequest.url?.includes('/api/notifications'));

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
                const isProtectedRoute = isAdmin || window.location.pathname.startsWith("/dashboard");

                if (window.location.pathname !== loginPath && isProtectedRoute) {
                    redirectToLogin(loginPath);
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
                const isProtectedRoute = isAdmin || window.location.pathname.startsWith("/dashboard");
                if (window.location.pathname !== loginPath && isProtectedRoute) {
                    redirectToLogin(loginPath);
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