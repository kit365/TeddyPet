import { apiApp } from "./index";

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

export interface LoginPayload {
    usernameOrEmail: string;
    password: string;
}

export const register = async (data: RegisterPayload) => {
    const response = await apiApp.post("/api/auth/register", data);
    return response.data;
};

export const login = async (data: LoginPayload) => {
    const response = await apiApp.post("/api/auth/login", data);
    return response.data;
};

export const forgotPassword = async (email: string) => {
    const response = await apiApp.post("/api/auth/forgot-password", { email });
    return response.data;
};

export const verifyEmail = async (token: string) => {
    const response = await apiApp.get("/api/auth/verify-email", {
        params: { token }
    });
    return response.data;
};

export const validateResetToken = async (token: string) => {
    const response = await apiApp.get("/api/auth/validate-reset-token", {
        params: { token }
    });
    return response.data;
};

export const resendEmail = async (email: string) => {
    const response = await apiApp.post("/api/auth/resend-email", { email });
    return response.data;
};

export const getMe = async () => {
    const response = await apiApp.get("/api/auth/me");
    return response.data;
};

export const logout = async () => {
    const response = await apiApp.post("/api/auth/logout");
    return response.data;
};

export interface ResetPasswordPayload {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export const resetPassword = async (data: ResetPasswordPayload) => {
    const response = await apiApp.post("/api/auth/reset-password", data);
    return response.data;
};
