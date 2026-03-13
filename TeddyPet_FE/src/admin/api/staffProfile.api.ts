import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE = '/api/staff/profiles';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export type GenderEnum = 'MALE' | 'FEMALE' | 'OTHER';

export type EmploymentTypeEnum = 'PART_TIME' | 'FULL_TIME';

export interface IStaffProfile {
    staffId: number;
    userId?: string | null;
    username?: string | null;
    fullName: string;
    email?: string | null;
    phoneNumber?: string | null;
    citizenId?: string | null;
    dateOfBirth?: string | null;
    gender?: GenderEnum | null;
    avatarUrl?: string | null;
    altImage?: string | null;
    address?: string | null;
    bankAccountNo?: string | null;
    bankName?: string | null;
    positionId?: number | null;
    positionCode?: string | null;
    positionName?: string | null;
    employmentType?: EmploymentTypeEnum | null;
    backupEmail?: string | null;
    googleWhitelistStatus?: string | null;
    active: boolean;
}

export interface IStaffOnboardingRequest {
    fullName: string;
    email?: string | null;
    phoneNumber?: string | null;
    citizenId?: string | null;
    dateOfBirth?: string | null;
    gender?: GenderEnum | null;
    avatarUrl?: string | null;
    altImage?: string | null;
    address?: string | null;
    bankAccountNo?: string | null;
    bankName?: string | null;
    positionId?: number | null;
    employmentType?: EmploymentTypeEnum | null;
    assignedRole?: string | null;
    backupEmail?: string | null;
}

export interface IStaffProfileUpdateRequest {
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    citizenId?: string | null;
    dateOfBirth?: string | null;
    gender?: GenderEnum | null;
    avatarUrl?: string | null;
    altImage?: string | null;
    address?: string | null;
    bankAccountNo?: string | null;
    bankName?: string | null;
    positionId?: number | null;
    employmentType?: EmploymentTypeEnum | null;
    backupEmail?: string | null;
}

export interface IAccountProvisionRequest {
    username?: string | null;
    password?: string | null;
    roleName: string;
}

export const getStaffProfiles = async (): Promise<ApiResponse<IStaffProfile[]>> => {
    const res = await apiApp.get(BASE, withAuth());
    return res.data;
};

export const getStaffProfileById = async (id: string | number): Promise<ApiResponse<IStaffProfile>> => {
    const res = await apiApp.get(`${BASE}/${id}`, withAuth());
    return res.data;
};

/** Lấy hồ sơ nhân viên của user đang đăng nhập (work_type, positionId cho trang Đăng ký ca) */
export const getMyStaffProfile = async (): Promise<ApiResponse<IStaffProfile>> => {
    const res = await apiApp.get(`${BASE}/me`, withAuth());
    return res.data;
};

export const createStaffOnboarding = async (data: IStaffOnboardingRequest): Promise<ApiResponse<IStaffProfile>> => {
    const res = await apiApp.post(BASE, data, withAuth());
    return res.data;
};

export const provisionAccount = async (staffId: number, data: IAccountProvisionRequest): Promise<ApiResponse<IStaffProfile>> => {
    const res = await apiApp.post(`${BASE}/${staffId}/account`, data, withAuth());
    return res.data;
};

export const updateStaffProfile = async (staffId: number, data: IStaffProfileUpdateRequest): Promise<ApiResponse<IStaffProfile>> => {
    const res = await apiApp.put(`${BASE}/${staffId}`, data, withAuth());
    return res.data;
};

export const deactivateStaff = async (staffId: number): Promise<ApiResponse<unknown>> => {
    const res = await apiApp.delete(`${BASE}/${staffId}`, withAuth());
    return res.data;
};

export const reactivateStaff = async (staffId: number): Promise<ApiResponse<IStaffProfile>> => {
    const res = await apiApp.put(`${BASE}/${staffId}/reactivate`, {}, withAuth());
    return res.data;
};
