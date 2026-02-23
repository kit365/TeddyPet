import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE_URL = '/api/time-slots';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export type DayType = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
export type SlotType = 'REGULAR' | 'PEAK' | 'OFF_PEAK' | 'SPECIAL';

export interface ITimeSlot {
    id: number;
    serviceId: number;
    dayType: DayType;
    startTime: string;
    endTime: string;
    maxCapacity: number;
    currentBookings: number;
    slotType: SlotType;
    notes: string | null;
    status: string;
    version: number;
}

export const getTimeSlotsByService = async (serviceId: number): Promise<ApiResponse<ITimeSlot[]>> => {
    const response = await apiApp.get(`${BASE_URL}/service/${serviceId}`, withAuth());
    return response.data;
};

export const getTimeSlotById = async (id: number | string): Promise<ApiResponse<ITimeSlot>> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

export const createOrUpdateTimeSlot = async (data: {
    id?: number | null;
    serviceId: number;
    dayType: DayType;
    startTime: string;
    endTime: string;
    maxCapacity?: number;
    slotType?: SlotType;
    notes?: string | null;
}): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

export const deleteTimeSlot = async (id: number | string): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};
