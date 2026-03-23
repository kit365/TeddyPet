import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";

/** Khớp BE NoShowPublicClientResponse — dùng cho khách đặt lịch */
export interface NoShowPublicClientResponse {
    name: string;
    gracePeriodMinutes: number;
    autoMarkNoShow: boolean;
    penaltyAmount: number;
    allowLateCheckin: boolean;
    lateCheckinMinutes: number;
}

export const getNoShowPublicByServiceId = async (
    serviceId: number
): Promise<ApiResponse<NoShowPublicClientResponse | null>> => {
    const response = await apiApp.get<ApiResponse<NoShowPublicClientResponse | null>>(
        `/api/no-show-config/by-service/${serviceId}`
    );
    return response.data;
};
