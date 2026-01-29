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

apiApp.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            if (window.location.pathname.startsWith("/admin")) {
                Cookies.remove("tokenAdmin");
                window.location.href = "/admin/login";
            }
        }
        return Promise.reject(error);
    }
);

export { apiApp }