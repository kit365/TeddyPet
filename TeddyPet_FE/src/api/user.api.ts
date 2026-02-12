import { apiApp } from "./index";
import { UpdateProfilePayload, UpdateProfileResponse, ChangePasswordPayload } from "../types/auth.type";

const BASE_PATH = "/api/users";

export const updateProfile = async (data: UpdateProfilePayload): Promise<UpdateProfileResponse> => {
    const response = await apiApp.put(`${BASE_PATH}/profile`, data);
    return response.data;
};

export const sendChangePasswordOtp = async (): Promise<{ message: string; data: number }> => {
    const response = await apiApp.post(`${BASE_PATH}/change-password/send-otp`);
    return response.data;
};

export const verifyChangePasswordOtp = async (otpCode: string): Promise<{ message: string }> => {
    const response = await apiApp.post(`${BASE_PATH}/change-password/verify-otp`, null, {
        params: { otpCode }
    });
    return response.data;
};

export const verifyOldPassword = async (password: string): Promise<{ message: string }> => {
    const response = await apiApp.post(`${BASE_PATH}/change-password/verify-password`, null, {
        params: { password }
    });
    return response.data;
};

export const changePassword = async (data: ChangePasswordPayload): Promise<{ message: string }> => {
    const response = await apiApp.put(`${BASE_PATH}/change-password`, data);
    return response.data;
};
