import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";
import type { ServiceCategoryClient, ServiceClient } from "../types/booking.type";

const CATEGORIES_URL = "/api/service-categories";
const SERVICES_URL = "/api/services";
const ROOM_LAYOUT_CONFIGS_URL = "/api/room-layout-configs";
const ROOMS_URL = "/api/rooms";

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

/** Room layout configs (public — for client booking room picker) */
export interface RoomLayoutConfigClient {
    id: number;
    layoutName?: string | null;
    maxRows: number;
    maxCols: number;
    backgroundImage?: string | null;
    status?: string | null;
    serviceId?: number | null;
    serviceName?: string | null;
}

export const getRoomLayoutConfigsByServiceId = async (serviceId: number): Promise<ApiResponse<RoomLayoutConfigClient[]>> => {
    const response = await apiApp.get(ROOM_LAYOUT_CONFIGS_URL, { params: { serviceId } });
    return response.data;
};

/** Rooms (public — for client booking room picker) */
export interface RoomClient {
    roomId: number;
    roomTypeId: number;
    roomTypeName?: string;
    roomNumber: string;
    roomName?: string | null;
    tier?: string | null;
    gridRow?: number | null;
    gridCol?: number | null;
    isSorted?: boolean | null;
    roomLayoutConfigId?: number | null;
    capacity?: number | null;
    status: string;
    isActive: boolean;
}

export const getRoomsByLayoutConfigId = async (layoutConfigId: number): Promise<ApiResponse<RoomClient[]>> => {
    const response = await apiApp.get(ROOMS_URL, { params: { roomLayoutConfigId: layoutConfigId } });
    return response.data;
};
