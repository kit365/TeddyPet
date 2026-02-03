import axios from "axios"
import Cookies from "js-cookie"

const BASE_URL = "http://localhost:8080"

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

// Flag to prevent multiple refresh requests
let isRefreshing = false;
// Queue of failed requests
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

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

            // Determine if Admin or Client
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
            isRefreshing = true;

            const refreshToken = Cookies.get(refreshTokenKey);

            if (!refreshToken) {
                Cookies.remove(tokenKey);
                Cookies.remove(refreshTokenKey);
                window.location.href = loginPath;
                return Promise.reject(error);
            }

            try {
                // Use a separate axios instance or direct axios to avoid interceptor loop
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
                // Clear tokens and redirect
                Cookies.remove(tokenKey);
                Cookies.remove(refreshTokenKey);
                window.location.href = loginPath;
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export { apiApp }