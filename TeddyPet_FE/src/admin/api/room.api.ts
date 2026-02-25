import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const ROOM_TYPES_URL = '/api/room-types';
const ROOMS_URL = '/api/rooms';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export interface IRoomType {
    roomTypeId: number;
    serviceId?: number | null;
    serviceName?: string | null;
    typeName: string;
    displayTypeName?: string | null;
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
    isActive: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface IRoom {
    roomId: number;
    roomTypeId: number;
    roomTypeName?: string;
    roomNumber: string;
    roomName?: string | null;
    block?: string | null;
    tier?: string | null;
    gridRow?: number | null;
    gridCol?: number | null;
    isSorted?: boolean | null;
    roomLayoutConfigId?: number | null;
    additionalAmenities?: string | null;
    removedAmenities?: string | null;
    images?: string | null;
    capacity?: number | null;
    notes?: string | null;
    area?: number | null;
    status: string;
    isActive: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

export const getRoomTypes = async (serviceId?: number | null): Promise<ApiResponse<IRoomType[]>> => {
    const params = serviceId != null ? { serviceId } : undefined;
    const response = await apiApp.get(ROOM_TYPES_URL, { ...withAuth(), params });
    return response.data;
};

export const getRoomTypeById = async (id: string | number): Promise<ApiResponse<IRoomType>> => {
    const response = await apiApp.get(`${ROOM_TYPES_URL}/${id}`, withAuth());
    return response.data;
};

export const createOrUpdateRoomType = async (data: Record<string, unknown>): Promise<ApiResponse<IRoomType>> => {
    const response = await apiApp.post(ROOM_TYPES_URL, data, withAuth());
    return response.data;
};

export const deleteRoomType = async (id: string | number): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${ROOM_TYPES_URL}/${id}`, withAuth());
    return response.data;
};

/** Set or clear service for a room type. serviceId null to unlink. */
export const updateRoomTypeServiceId = async (
    roomTypeId: number,
    serviceId: number | null
): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.patch(`${ROOM_TYPES_URL}/${roomTypeId}/service`, { serviceId }, withAuth());
    return response.data;
};

export const getRooms = async (roomTypeId?: number | null): Promise<ApiResponse<IRoom[]>> => {
    const params = roomTypeId != null ? { roomTypeId } : undefined;
    const response = await apiApp.get(ROOMS_URL, { ...withAuth(), params });
    return response.data;
};

export const getRoomById = async (id: string | number): Promise<ApiResponse<IRoom>> => {
    const response = await apiApp.get(`${ROOMS_URL}/${id}`, withAuth());
    return response.data;
};

export const createOrUpdateRoom = async (data: Record<string, unknown>): Promise<ApiResponse<IRoom>> => {
    const response = await apiApp.post(ROOMS_URL, data, withAuth());
    return response.data;
};

export const deleteRoom = async (id: string | number): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${ROOMS_URL}/${id}`, withAuth());
    return response.data;
};

export interface IRoomSetPositionRequest {
    roomLayoutConfigId: number;
    gridRow: number;
    gridCol: number;
    tier: string;
    roomNumber: string;
}

export const setRoomPosition = async (roomId: number, data: IRoomSetPositionRequest): Promise<ApiResponse<IRoom>> => {
    const response = await apiApp.put(`${ROOMS_URL}/${roomId}/position`, data, withAuth());
    return response.data;
};

// Room Layout Config
const ROOM_LAYOUT_CONFIGS_URL = '/api/room-layout-configs';

export interface IRoomLayoutConfig {
    id: number;
    layoutName?: string | null;
    block?: string | null;
    maxRows: number;
    maxCols: number;
    backgroundImage?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export const getRoomLayoutConfigs = async (): Promise<ApiResponse<IRoomLayoutConfig[]>> => {
    const response = await apiApp.get(ROOM_LAYOUT_CONFIGS_URL, withAuth());
    return response.data;
};

export const getRoomLayoutConfigById = async (id: number): Promise<ApiResponse<IRoomLayoutConfig>> => {
    const response = await apiApp.get(`${ROOM_LAYOUT_CONFIGS_URL}/${id}`, withAuth());
    return response.data;
};

export const createRoomLayoutConfig = async (data: Record<string, unknown>): Promise<ApiResponse<IRoomLayoutConfig>> => {
    const response = await apiApp.post(ROOM_LAYOUT_CONFIGS_URL, data, withAuth());
    return response.data;
};

export const updateRoomLayoutConfig = async (id: number, data: Record<string, unknown>): Promise<ApiResponse<IRoomLayoutConfig>> => {
    const response = await apiApp.put(`${ROOM_LAYOUT_CONFIGS_URL}/${id}`, data, withAuth());
    return response.data;
};

export const deleteRoomLayoutConfig = async (id: number): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${ROOM_LAYOUT_CONFIGS_URL}/${id}`, withAuth());
    return response.data;
};

// Room_Blockings: tạo khóa phòng → BE set room.status = BLOCKED
const ROOM_BLOCKINGS_URL = '/api/room-blockings';

export interface IRoomBlockingCreateRequest {
    roomId: number;
    blockReason?: string | null;
    blockedFrom: string; // ISO datetime
    blockedTo: string;
    blockedBy?: string | null;
}

export interface IRoomBlockingResponse {
    id: number;
    roomId: number;
    roomNumber?: string;
    blockReason?: string | null;
    blockedFrom: string;
    blockedTo: string;
    blockedBy?: string | null;
    createdAt?: string;
    createdBy?: string | null;
}

export const createRoomBlocking = async (data: IRoomBlockingCreateRequest): Promise<ApiResponse<IRoomBlockingResponse>> => {
    const response = await apiApp.post(ROOM_BLOCKINGS_URL, data, withAuth());
    return response.data;
};
