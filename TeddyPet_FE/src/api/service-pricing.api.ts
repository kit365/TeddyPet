import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";
import type { IServicePricing } from "../admin/pages/service/configs/types";

const BASE_URL = "/api/service-pricings";

export const getServicePricingsByServiceId = async (
    serviceId: number
): Promise<ApiResponse<IServicePricing[]>> => {
    const response = await apiApp.get(`${BASE_URL}?serviceId=${serviceId}`);
    return response.data;
};

