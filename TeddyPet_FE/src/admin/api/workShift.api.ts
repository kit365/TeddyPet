import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const STAFF_BASE = '/api/staff/work-shifts';
const ADMIN_BASE = '/api/admin/work-shifts';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export type ShiftStatus = 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IWorkShift {
    shiftId: number;
    staffId?: number | null;
    staffFullName?: string | null;
    startTime: string;
    endTime: string;
    status: ShiftStatus;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    version?: number | null;
}

export interface IWorkShiftRegistration {
    registrationId: number;
    workShiftId: number;
    staffId: number;
    staffFullName: string;
    status: RegistrationStatus;
    registeredAt: string;
}

export interface IOpenShiftRequest {
    startTime: string; // ISO datetime
    endTime: string;
}

/** Admin: create open shift */
export const createOpenShift = async (data: IOpenShiftRequest): Promise<ApiResponse<IWorkShift>> => {
    const res = await apiApp.post(ADMIN_BASE, data, withAuth());
    return res.data;
};

/** Admin: get shift by id */
export const getWorkShiftById = async (shiftId: number): Promise<ApiResponse<IWorkShift>> => {
    const res = await apiApp.get(`${ADMIN_BASE}/${shiftId}`, withAuth());
    return res.data;
};

/** Admin: get registrations for a shift */
export const getRegistrationsForShift = async (shiftId: number): Promise<ApiResponse<IWorkShiftRegistration[]>> => {
    const res = await apiApp.get(`${ADMIN_BASE}/${shiftId}/registrations`, withAuth());
    return res.data;
};

/** Admin: approve registration */
export const approveRegistration = async (shiftId: number, registrationId: number): Promise<ApiResponse<IWorkShift>> => {
    const res = await apiApp.post(`${ADMIN_BASE}/${shiftId}/registrations/${registrationId}/approve`, {}, withAuth());
    return res.data;
};

/** Staff: get available (open) shifts */
export const getAvailableShifts = async (from?: string | null, to?: string | null): Promise<ApiResponse<IWorkShift[]>> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiApp.get(`${STAFF_BASE}/available`, { ...withAuth(), params });
    return res.data;
};

/** Staff: register for shift */
export const registerForShift = async (shiftId: number): Promise<ApiResponse<IWorkShiftRegistration>> => {
    const res = await apiApp.post(`${STAFF_BASE}/${shiftId}/register`, {}, withAuth());
    return res.data;
};

/** Get shifts by staff and date range */
export const getShiftsByStaffAndDateRange = async (
    staffId: number,
    from?: string | null,
    to?: string | null
): Promise<ApiResponse<IWorkShift[]>> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiApp.get(`${STAFF_BASE}/staff/${staffId}`, { ...withAuth(), params });
    return res.data;
};

/** Staff: get my shifts */
export const getMyShifts = async (from?: string | null, to?: string | null): Promise<ApiResponse<IWorkShift[]>> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiApp.get(`${STAFF_BASE}/my-shifts`, { ...withAuth(), params });
    return res.data;
};
