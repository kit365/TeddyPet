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

export const getUsers = async (): Promise<ApiResponse<IUserProfile[]>> => {
    const res = await apiApp.get(BASE, withAuth());
    return res.data;
};
