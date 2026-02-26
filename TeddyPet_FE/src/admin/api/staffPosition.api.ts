import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE = '/api/staff/positions';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export interface IStaffPosition {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    active: boolean;
}

export interface IStaffPositionRequest {
    code: string;
    name: string;
    description?: string | null;
}

export const getStaffPositions = async (): Promise<ApiResponse<IStaffPosition[]>> => {
    const res = await apiApp.get(BASE, withAuth());
    return res.data;
};

export const getStaffPositionById = async (id: string | number): Promise<ApiResponse<IStaffPosition>> => {
    const res = await apiApp.get(`${BASE}/${id}`, withAuth());
    return res.data;
};

export const createStaffPosition = async (data: IStaffPositionRequest): Promise<ApiResponse<IStaffPosition>> => {
    const res = await apiApp.post(BASE, data, withAuth());
    return res.data;
};

export const updateStaffPosition = async (id: number, data: IStaffPositionRequest): Promise<ApiResponse<IStaffPosition>> => {
    const res = await apiApp.put(`${BASE}/${id}`, data, withAuth());
    return res.data;
};

export const deleteStaffPosition = async (id: number): Promise<ApiResponse<unknown>> => {
    const res = await apiApp.delete(`${BASE}/${id}`, withAuth());
    return res.data;
};
