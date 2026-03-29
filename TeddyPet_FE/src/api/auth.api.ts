import { apiApp } from "./index";
import {
    RegisterPayload,
    LoginPayload,
    ChangeUnverifiedEmailPayload,
    ResetPasswordPayload,
    RegisterResponse,
    AuthResponse,
    ForgotPasswordResponse,
    ValidateResetTokenResponse,
    MeResponse,
    LogoutResponse,
    ResetPasswordResponse,
    TokenResponse
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

export type StaffPasswordReissuePreview = {
    email: string;
    username: string;
    fullName: string;
    staffId: number | null;
};

export const requestStaffPasswordReissue = async (usernameOrEmail: string) => {
    const response = await apiApp.post(`${BASE_PATH}/staff/password-reissue/request`, { usernameOrEmail });
    return response.data as { success: boolean; message?: string };
};

export const previewStaffPasswordReissue = async (token: string) => {
    const response = await apiApp.get<{ success: boolean; data: StaffPasswordReissuePreview; message?: string }>(
        "/api/admin/staff/password-reissue/preview",
        { params: { token } }
    );
    return response.data;
};

export const confirmStaffPasswordReissue = async (token: string) => {
    const response = await apiApp.post("/api/admin/staff/password-reissue/confirm", { token });
    return response.data as { success: boolean; message?: string };
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

export const getMe = async (customToken?: string): Promise<MeResponse> => {
    const config = customToken ? { headers: { Authorization: `Bearer ${customToken}` } } : {};
    const response = await apiApp.get(`${BASE_PATH}/me`, config);
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

export const changeUnverifiedEmail = async (data: ChangeUnverifiedEmailPayload): Promise<RegisterResponse> => {
    const response = await apiApp.post(`${BASE_PATH}/change-email`, data);
    return response.data;
};

export const loginWithGoogle = async (idToken: string): Promise<{ success: boolean; data: TokenResponse; message?: string }> => {
    const response = await apiApp.post(`${BASE_PATH}/google`, { idToken });
    return response.data;
};
