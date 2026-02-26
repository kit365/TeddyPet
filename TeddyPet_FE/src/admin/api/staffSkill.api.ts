import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE = '/api/staff/skills-map';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface IStaffSkill {
    id: number;
    staffId: number;
    skillId: number;
    skillCode: string;
    skillName: string;
    proficiencyLevel: ProficiencyLevel;
    commissionRate: number;
    active: boolean;
}

export interface IStaffSkillRequest {
    staffId: number;
    skillId: number;
    proficiencyLevel: ProficiencyLevel;
    commissionRate: number;
}

export const getStaffSkillsByStaffId = async (staffId: number): Promise<ApiResponse<IStaffSkill[]>> => {
    const res = await apiApp.get(`${BASE}/staff/${staffId}`, withAuth());
    return res.data;
};

export const getStaffSkillById = async (id: number): Promise<ApiResponse<IStaffSkill>> => {
    const res = await apiApp.get(`${BASE}/${id}`, withAuth());
    return res.data;
};

export const createStaffSkill = async (data: IStaffSkillRequest): Promise<ApiResponse<IStaffSkill>> => {
    const res = await apiApp.post(BASE, data, withAuth());
    return res.data;
};

export const updateStaffSkill = async (id: number, data: IStaffSkillRequest): Promise<ApiResponse<IStaffSkill>> => {
    const res = await apiApp.put(`${BASE}/${id}`, data, withAuth());
    return res.data;
};

export const deleteStaffSkill = async (id: number): Promise<ApiResponse<unknown>> => {
    const res = await apiApp.delete(`${BASE}/${id}`, withAuth());
    return res.data;
};
