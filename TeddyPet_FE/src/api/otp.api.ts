import { apiApp } from "./index";
import { ApiResponse } from "../types/common.type";

const BASE_PATH = "/api/otp";

export interface SendOtpRequest {
    email: string;
}

export interface VerifyOtpRequest {
    email: string;
    otpCode: string;
}

/**
 * Gửi mã OTP xác thực email cho khách vãng lai
 */
export const sendGuestOtp = async (email: string) => {
    const response = await apiApp.post<ApiResponse<number>>(`${BASE_PATH}/send`, { email });
    return response.data;
};

/**
 * Kiểm tra mã OTP khách vãng lai (không xóa OTP trong server)
 */
export const verifyGuestOtp = async (email: string, otpCode: string) => {
    const response = await apiApp.post<ApiResponse<string>>(`${BASE_PATH}/verify`, { email, otpCode });
    return response.data;
};
