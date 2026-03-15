import { apiApp } from "../../api/index";
import { ApiResponse } from "../../types/common.type";

export interface AppSettingResponse {
    settingKey: string;
    settingValue: string;
    description: string;
}

/** Thông tin tài khoản nhận tiền (thanh toán online PayOS) */
export interface ReceivingAccountResponse {
    id: number;
    accountNumber: string;
    accountHolderName: string;
    bankCode: string;
    bankName: string;
    isVerify: boolean;
    isDefault: boolean;
    note?: string | null;
    /** URL ảnh mã QR VietQR đã lưu - dùng để hiển thị/tải khi cần mà không cần tạo lại */
    vietqrImageUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export const getAllSettings = async (): Promise<ApiResponse<AppSettingResponse[]>> => {
    const response = await apiApp.get<ApiResponse<AppSettingResponse[]>>("/api/settings");
    return response.data;
};

export const updateSetting = async (key: string, value: string, description?: string): Promise<ApiResponse<void>> => {
    const response = await apiApp.put<ApiResponse<void>>(`/api/settings/${key}`, { settingValue: value, description });
    return response.data;
};

export const getReceivingAccount = async (): Promise<ApiResponse<ReceivingAccountResponse | null>> => {
    const response = await apiApp.get<ApiResponse<ReceivingAccountResponse | null>>("/api/settings/receiving-account");
    return response.data;
};

export const updateReceivingAccount = async (payload: {
    bankCode: string;
    accountNumber: string;
    accountHolderName: string;
    note?: string | null;
}): Promise<ApiResponse<ReceivingAccountResponse>> => {
    const response = await apiApp.put<ApiResponse<ReceivingAccountResponse>>("/api/settings/receiving-account", payload);
    return response.data;
};
