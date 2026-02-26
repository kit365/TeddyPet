import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE_URL = '/api/shop-operation-hours';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export interface IShopOperationHour {
    id: number;
    dayOfWeek: number; // 1=Mon, 7=Sun
    openTime: string | null; // "08:00"
    closeTime: string | null; // "20:00"
    isDayOff: boolean;
    breakStartTime: string | null;
    breakEndTime: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export const getShopOperationHours = async (): Promise<ApiResponse<IShopOperationHour[]>> => {
    const response = await apiApp.get(BASE_URL, withAuth());
    return response.data;
};

export const getShopOperationHourByDay = async (dayOfWeek: number): Promise<ApiResponse<IShopOperationHour>> => {
    const response = await apiApp.get(`${BASE_URL}/day/${dayOfWeek}`, withAuth());
    return response.data;
};

export const upsertShopOperationHour = async (data: {
    id?: number | null;
    dayOfWeek: number;
    openTime?: string | null;
    closeTime?: string | null;
    isDayOff?: boolean;
    breakStartTime?: string | null;
    breakEndTime?: string | null;
}): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

export const upsertShopOperationHoursBatch = async (
    data: Array<{
        id?: number | null;
        dayOfWeek: number;
        openTime?: string | null;
        closeTime?: string | null;
        isDayOff?: boolean;
        breakStartTime?: string | null;
        breakEndTime?: string | null;
    }>
): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.post(`${BASE_URL}/batch`, data, withAuth());
    return response.data;
};
