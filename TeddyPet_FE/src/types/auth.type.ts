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

export interface ChangeUnverifiedEmailPayload {
    oldEmail: string;
    newEmail: string;
    password: string;
}

export interface ResetPasswordPayload {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

import { ApiResponse } from "./common.type";

export interface TokenResponse {
    token: string;
    refreshToken: string;
    expiresAt: string;
    mustChangePassword?: boolean;
}


export type AuthResponse = ApiResponse<TokenResponse>;

export interface RegisterResponseData {
    message: string;
    cooldownSeconds: number;
    cooldownEndsAt: string;
}

export type RegisterResponse = ApiResponse<RegisterResponseData>;

export interface UserProfileResponse {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    avatarUrl?: string;
    altImage?: string;
    gender?: string;
    dateOfBirth?: string;
    status?: string;
    role?: string;
    mustChangePassword?: boolean;
    optionalEmail?: string;
}

export type MeResponse = ApiResponse<UserProfileResponse>;

export type ResetPasswordResponse = ApiResponse<void>;
export type ForgotPasswordResponse = ApiResponse<void>;
export type ValidateResetTokenResponse = ApiResponse<boolean>;
export type LogoutResponse = ApiResponse<void>;

export interface UpdateProfilePayload {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    optionalEmail?: string;
    avatarUrl?: string;
    altImage?: string;
}

export type UpdateProfileResponse = ApiResponse<UserProfileResponse>;

export interface AuthUser extends UserProfileResponse {
    expiresAt?: string;
    mustChangePassword?: boolean;
}

export interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isHydrated: boolean;
    login: (user: AuthUser, token: string, refreshToken?: string) => void;
    adminLoginSync: (user: AuthUser, tokenAdmin: string) => void;
    logout: () => void;
    set: (newState: Partial<AuthState>) => void;
}export interface ChangePasswordPayload {
    oldPassword: string;
    newPassword: string;
    otpCode: string;
}
