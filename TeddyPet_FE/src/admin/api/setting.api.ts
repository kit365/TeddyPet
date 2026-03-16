import { apiApp } from "../../api/index";
import { ApiResponse } from "../../types/common.type";

export interface AppSettingResponse {
    settingKey: string;
    settingValue: string;
    description: string;
}

export const getAllSettings = async (): Promise<ApiResponse<AppSettingResponse[]>> => {
    const response = await apiApp.get<ApiResponse<AppSettingResponse[]>>("/api/settings");
    return response.data;
};

export const updateSetting = async (key: string, value: string, description?: string): Promise<ApiResponse<void>> => {
    const response = await apiApp.put<ApiResponse<void>>(`/api/settings/${key}`, { settingValue: value, description });
    return response.data;
};
