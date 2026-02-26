import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE = '/api/staff/skills';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export interface ISkill {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    active: boolean;
}

export interface ISkillRequest {
    code: string;
    name: string;
    description?: string | null;
}

export const getSkills = async (): Promise<ApiResponse<ISkill[]>> => {
    const res = await apiApp.get(BASE, withAuth());
    return res.data;
};

export const getSkillById = async (id: string | number): Promise<ApiResponse<ISkill>> => {
    const res = await apiApp.get(`${BASE}/${id}`, withAuth());
    return res.data;
};

export const createSkill = async (data: ISkillRequest): Promise<ApiResponse<ISkill>> => {
    const res = await apiApp.post(BASE, data, withAuth());
    return res.data;
};

export const updateSkill = async (id: number, data: ISkillRequest): Promise<ApiResponse<ISkill>> => {
    const res = await apiApp.put(`${BASE}/${id}`, data, withAuth());
    return res.data;
};

export const deleteSkill = async (id: number): Promise<ApiResponse<unknown>> => {
    const res = await apiApp.delete(`${BASE}/${id}`, withAuth());
    return res.data;
};
