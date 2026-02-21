import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";
import type { ServiceCategoryClient, ServiceClient } from "../types/booking.type";

const CATEGORIES_URL = "/api/service-categories";
const SERVICES_URL = "/api/services";

export const getServiceCategories = async (): Promise<ApiResponse<ServiceCategoryClient[]>> => {
    const response = await apiApp.get(CATEGORIES_URL);
    return response.data;
};

export const getServices = async (): Promise<ApiResponse<ServiceClient[]>> => {
    const response = await apiApp.get(SERVICES_URL);
    return response.data;
};

export const getServicesByCategoryId = async (categoryId: number): Promise<ApiResponse<ServiceClient[]>> => {
    const response = await apiApp.get(`${SERVICES_URL}/category/${categoryId}`);
    return response.data;
};
