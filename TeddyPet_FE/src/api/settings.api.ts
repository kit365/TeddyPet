import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";

const BASE_PATH = "/api/settings";

/** Key cấu hình SĐT cửa hàng (dùng cho thông báo hỗ trợ khách đặt lịch). */
export const SHOP_PHONE_KEY = "SHOP_PHONE";

/**
 * Lấy giá trị cài đặt theo key (API public, dùng cho trang đặt lịch).
 */
export const getSettingByKey = async (key: string): Promise<ApiResponse<string>> => {
    const response = await apiApp.get<ApiResponse<string>>(`${BASE_PATH}/${key}`);
    return response.data;
};

/**
 * Lấy số điện thoại hỗ trợ (cấu hình tại trang admin) để hiển thị cho khách.
 */
export const getSupportPhone = async (): Promise<string | null> => {
    try {
        const res = await getSettingByKey(SHOP_PHONE_KEY);
        const value = res?.data;
        return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
    } catch {
        return null;
    }
};
