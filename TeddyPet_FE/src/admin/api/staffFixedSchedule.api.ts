import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE = '/api/admin/staff-fixed-schedules';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export interface IStaffFixedSchedule {
    scheduleId: number;
    staffId: number;
    staffFullName: string;
    positionId: number;
    positionName: string;
    dayOfWeek: number;
    isAfternoon: boolean;
}

export interface IStaffFixedScheduleRequest {
    staffId: number;
    positionId: number;
    dayOfWeek: number;
    isAfternoon: boolean;
}

export const getFixedSchedulesByStaffId = async (staffId: number): Promise<ApiResponse<IStaffFixedSchedule[]>> => {
    const res = await apiApp.get(BASE, { ...withAuth(), params: { staffId } });
    return res.data;
};

export const createFixedSchedule = async (data: IStaffFixedScheduleRequest): Promise<ApiResponse<IStaffFixedSchedule>> => {
    const res = await apiApp.post(BASE, data, withAuth());
    return res.data;
};

export const deleteFixedSchedule = async (scheduleId: number): Promise<ApiResponse<void>> => {
    const res = await apiApp.delete(`${BASE}/${scheduleId}`, withAuth());
    return res.data;
};
