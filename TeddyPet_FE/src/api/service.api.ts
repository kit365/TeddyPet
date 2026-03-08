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

export const getRoomLayoutConfigsByServiceId = async (
    serviceId: number,
    status?: string
): Promise<ApiResponse<RoomLayoutConfigClient[]>> => {
    const response = await apiApp.get(ROOM_LAYOUT_CONFIGS_URL, { params: { serviceId, status } });
    return response.data;
};

/** Rooms (public — for client booking room picker & room detail) */
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
    /** Chi tiết phòng (khi gọi getRoomById) */
    additionalAmenities?: string | null;
    images?: string | null;
    notes?: string | null;
    area?: number | null;
}

export const getRoomsByLayoutConfigId = async (layoutConfigId: number): Promise<ApiResponse<RoomClient[]>> => {
    const response = await apiApp.get(ROOMS_URL, { params: { roomLayoutConfigId: layoutConfigId } });
    return response.data;
};

/** Room types (public — for client booking room type buttons) */
export interface RoomTypeClient {
    roomTypeId: number;
    typeName: string;
    displayTypeName?: string | null;
    isActive: boolean;
    isDeleted?: boolean;
}

/** Room type detail (public — for client room detail page) */
export interface RoomTypeDetailClient extends RoomTypeClient {
    serviceId?: number | null;
    serviceName?: string | null;
    slug?: string | null;
    description?: string | null;
    shortDescription?: string | null;
    imageUrl?: string | null;
    galleryImages?: string[] | null;
    minArea?: number | null;
    maxArea?: number | null;
    maxPets?: number | null;
    minPetWeight?: number | null;
    maxPetWeight?: number | null;
    suitablePetSizes?: string | null;
    suitablePetTypes?: string[] | null;
    basePricePerNight?: number | null;
    standardAmenities?: string | null;
    features?: string | null;
    displayOrder?: number | null;
    cancellationPolicy?: string | null;
    requiresVaccination?: boolean;
    requiresHealthCheck?: boolean;
    totalRooms?: number | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    keywords?: string | null;
}

export const getRoomTypes = async (serviceId: number): Promise<ApiResponse<RoomTypeClient[]>> => {
    const response = await apiApp.get("/api/room-types", { params: { serviceId } });
    return response.data;
};

/** Lấy chi tiết phòng theo ID (public — cho trang xem chi tiết phòng). */
export const getRoomById = async (id: number | string): Promise<ApiResponse<RoomClient>> => {
    const response = await apiApp.get<ApiResponse<RoomClient>>(`${ROOMS_URL}/${id}`);
    return response.data;
};

/** Lấy chi tiết loại phòng theo ID (public — cho trang xem chi tiết phòng). */
export const getRoomTypeById = async (id: number | string): Promise<ApiResponse<RoomTypeDetailClient>> => {
    const response = await apiApp.get<ApiResponse<RoomTypeDetailClient>>(`/api/room-types/${id}`);
    return response.data;
};

/** Time slot (public — cho client chọn khung giờ dịch vụ). */
export interface TimeSlotClient {
    id: number;
    serviceId: number;
    startTime: string;
    endTime: string;
    dayType?: string;
    status?: string;
    /** Số chỗ đã đặt; dùng cùng maxCapacity để ẩn slot đã đủ. */
    currentBookings?: number | null;
    /** Số chỗ tối đa; nếu currentBookings >= maxCapacity thì không cho chọn. */
    maxCapacity?: number | null;
    /** Phiên bản cho optimistic lock khi BE cập nhật currentBookings. */
    version?: number | null;
}

/** Lấy danh sách khung giờ theo dịch vụ (public — cho đặt lịch chọn time slot). */
export const getTimeSlotsByServiceId = async (serviceId: number): Promise<ApiResponse<TimeSlotClient[]>> => {
    const response = await apiApp.get<ApiResponse<TimeSlotClient[]>>(`/api/time-slots/service/${serviceId}`);
    return response.data;
};
