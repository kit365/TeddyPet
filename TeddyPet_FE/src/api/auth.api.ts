import { apiApp } from "./index";
import {
    RegisterPayload,
    LoginPayload,
    ResetPasswordPayload,
    RegisterResponse,
    AuthResponse,
    ForgotPasswordResponse,
    ValidateResetTokenResponse,
    MeResponse,
    LogoutResponse,
    ResetPasswordResponse
} from "../types/auth.type";

const BASE_PATH = "/api/auth";

export const register = async (data: RegisterPayload): Promise<RegisterResponse> => {
    const response = await apiApp.post(`${BASE_PATH}/register`, data);
    return response.data;
};

export const login = async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await apiApp.post(`${BASE_PATH}/login`, data);
    return response.data;
};

export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
    const response = await apiApp.post(`${BASE_PATH}/forgot-password`, { email });
    return response.data;
};

export const verifyEmail = async (token: string): Promise<AuthResponse> => {
    const response = await apiApp.get(`${BASE_PATH}/verify-email`, {
        params: { token }
    });
    return response.data;
};

export const validateResetToken = async (token: string): Promise<ValidateResetTokenResponse> => {
    const response = await apiApp.get(`${BASE_PATH}/validate-reset-token`, {
        params: { token }
    });
    return response.data;
};

export const resendEmail = async (email: string): Promise<RegisterResponse> => {
    const response = await apiApp.post(`${BASE_PATH}/resend-email`, { email });
    return response.data;
};

export const getMe = async (): Promise<MeResponse> => {
    const response = await apiApp.get(`${BASE_PATH}/me`);
    return response.data;
};

export const logout = async (): Promise<LogoutResponse> => {
    const response = await apiApp.post(`${BASE_PATH}/logout`);
    return response.data;
};

export const refreshToken = async (refreshTokenRequest: string): Promise<AuthResponse> => {
    const response = await apiApp.post(`${BASE_PATH}/refresh-token`, { refreshToken: refreshTokenRequest });
    return response.data;
};

export const resetPassword = async (data: ResetPasswordPayload): Promise<ResetPasswordResponse> => {
    const response = await apiApp.post(`${BASE_PATH}/reset-password`, data);
    return response.data;
};
