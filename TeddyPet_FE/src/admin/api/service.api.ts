import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';
import { IService, IServicePricing } from '../pages/service/configs/types';

const BASE_URL = '/api/services';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export const getServices = async (params?: { isRequiredRoom?: boolean }): Promise<ApiResponse<IService[]>> => {
    const response = await apiApp.get(BASE_URL, { ...withAuth(), params });
    return response.data;
};

export const getServicesByCategoryId = async (categoryId: number): Promise<ApiResponse<IService[]>> => {
    const response = await apiApp.get(`${BASE_URL}/category/${categoryId}`, withAuth());
    return response.data;
};

export const getServiceById = async (id: string | number): Promise<ApiResponse<IService>> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

export const getServicePricings = async (serviceId: number): Promise<ApiResponse<IServicePricing[]>> => {
    const response = await apiApp.get(`${BASE_URL}/${serviceId}/pricings`, withAuth());
    return response.data;
};

export const createOrUpdateService = async (data: Record<string, unknown>): Promise<ApiResponse<IService>> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

export const deleteService = async (id: string | number): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

/** Thay thế toàn bộ loại phòng gắn với dịch vụ (bảng service_room_types). */
export const setServiceRoomTypes = async (
    serviceId: number,
    roomTypeIds: number[]
): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.put(`${BASE_URL}/${serviceId}/room-types`, roomTypeIds, withAuth());
    return response.data;
};
