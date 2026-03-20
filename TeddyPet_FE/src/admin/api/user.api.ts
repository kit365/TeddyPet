import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE = '/api/users';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export type UserStatusEnum = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';

export interface IUserProfile {
    id: string;
    username: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    altImage?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    status: UserStatusEnum;
    role: string;
    fullName?: string; // Virtual property for UI
}

export const getUsers = async (role?: string): Promise<ApiResponse<IUserProfile[]>> => {
    const res = await apiApp.get(BASE, {
        ...withAuth(),
        params: { role }
    });
    return res.data;
};

// ─── Excel ───────────────────────────────────────────────────────────────

export const exportUsersExcel = async (): Promise<Blob> => {
    const res = await apiApp.get(`${BASE}/excel/export`, { ...withAuth(), responseType: 'blob' });
    return res.data;
};

export const downloadUsersTemplate = async (): Promise<Blob> => {
    const res = await apiApp.get(`${BASE}/excel/template`, { ...withAuth(), responseType: 'blob' });
    return res.data;
};

export const importUsersExcel = async (file: File): Promise<ApiResponse<{ created: number; updated: number; skipped: number; errors: string[] }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiApp.post(`${BASE}/excel/import`, formData, {
        headers: { ...withAuth().headers, 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export const previewUsersImportExcel = async (file: File): Promise<ApiResponse<{ rowNumber: number; name: string; action: string; message: string }[]>> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiApp.post(`${BASE}/excel/preview`, formData, {
        headers: { ...withAuth().headers, 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};
