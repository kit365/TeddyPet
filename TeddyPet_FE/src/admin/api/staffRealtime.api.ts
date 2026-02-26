import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE = '/api/staff/realtime';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export type StaffRealtimeStatus = 'OFFLINE' | 'AVAILABLE' | 'BUSY' | 'ON_BREAK';

export interface IStaffRealtime {
    staffId: number;
    currentStatus: StaffRealtimeStatus;
    currentBookingId?: string | null;
    lastUpdated?: string | null;
}

export const getRealtimeStatus = async (staffId: number): Promise<ApiResponse<IStaffRealtime>> => {
    const res = await apiApp.get(`${BASE}/${staffId}`, withAuth());
    return res.data;
};

export const updateRealtimeStatus = async (
    staffId: number,
    status: StaffRealtimeStatus,
    bookingId?: string | null
): Promise<ApiResponse<IStaffRealtime>> => {
    const params: Record<string, string> = { status };
    if (bookingId) params.bookingId = bookingId;
    const res = await apiApp.post(`${BASE}/${staffId}/status`, null, { ...withAuth(), params });
    return res.data;
};

export const setAvailable = async (staffId: number): Promise<ApiResponse<IStaffRealtime>> => {
    const res = await apiApp.post(`${BASE}/${staffId}/available`, {}, withAuth());
    return res.data;
};

export const setBusy = async (staffId: number, bookingId: string): Promise<ApiResponse<IStaffRealtime>> => {
    const res = await apiApp.post(`${BASE}/${staffId}/busy`, null, { ...withAuth(), params: { bookingId } });
    return res.data;
};

export const setOffline = async (staffId: number): Promise<ApiResponse<IStaffRealtime>> => {
    const res = await apiApp.post(`${BASE}/${staffId}/offline`, {}, withAuth());
    return res.data;
};

export const setOnBreak = async (staffId: number): Promise<ApiResponse<IStaffRealtime>> => {
    const res = await apiApp.post(`${BASE}/${staffId}/on-break`, {}, withAuth());
    return res.data;
};
