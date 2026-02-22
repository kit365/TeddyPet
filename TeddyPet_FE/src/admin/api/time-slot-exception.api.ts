import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE_URL = '/api/time-slot-exceptions';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export interface ITimeSlotException {
    id: number;
    serviceId: number | null;
    timeExceptionName: string;
    startDate: string;
    endDate: string;
    scope: string;
    exceptionType: string | null;
    reason: string | null;
    isRecurring: boolean;
    recurrencePattern: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const getTimeSlotExceptions = async (): Promise<ApiResponse<ITimeSlotException[]>> => {
    const response = await apiApp.get(BASE_URL, withAuth());
    return response.data;
};

export const getTimeSlotExceptionsByService = async (serviceId: number): Promise<ApiResponse<ITimeSlotException[]>> => {
    const response = await apiApp.get(`${BASE_URL}/service/${serviceId}`, withAuth());
    return response.data;
};

export const getStoreWideExceptions = async (): Promise<ApiResponse<ITimeSlotException[]>> => {
    const response = await apiApp.get(`${BASE_URL}/store`, withAuth());
    return response.data;
};

export const getTimeSlotExceptionById = async (id: number | string): Promise<ApiResponse<ITimeSlotException>> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

export const createOrUpdateTimeSlotException = async (data: {
    id?: number | null;
    serviceId?: number | null;
    timeExceptionName: string;
    startDate: string;
    endDate: string;
    scope?: string;
    exceptionType?: string | null;
    reason?: string | null;
    isRecurring?: boolean;
    recurrencePattern?: string | null;
}): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

export const deleteTimeSlotException = async (id: number | string): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};
