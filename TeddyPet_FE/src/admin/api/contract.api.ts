import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE = '/api/staff/contracts';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export type ContractType = 'FULL_TIME' | 'PART_TIME';

export interface IContract {
    contractId: number;
    staffId: number;
    contractType?: ContractType | null;
    baseSalary: number;
    startDate: string;
    endDate?: string | null;
    status: string;
}

export interface IContractRequest {
    staffId: number;
    contractType?: ContractType | null;
    baseSalary: number;
    startDate: string;
    endDate?: string | null;
    status?: string | null;
}

export const getContractsByStaffId = async (staffId: number): Promise<ApiResponse<IContract[]>> => {
    const res = await apiApp.get(`${BASE}/staff/${staffId}`, withAuth());
    return res.data;
};

export const getContractById = async (contractId: number): Promise<ApiResponse<IContract>> => {
    const res = await apiApp.get(`${BASE}/${contractId}`, withAuth());
    return res.data;
};

export const createContract = async (data: IContractRequest): Promise<ApiResponse<IContract>> => {
    const res = await apiApp.post(BASE, data, withAuth());
    return res.data;
};

export const updateContract = async (contractId: number, data: IContractRequest): Promise<ApiResponse<IContract>> => {
    const res = await apiApp.put(`${BASE}/${contractId}`, data, withAuth());
    return res.data;
};

export const deleteContract = async (contractId: number): Promise<ApiResponse<unknown>> => {
    const res = await apiApp.delete(`${BASE}/${contractId}`, withAuth());
    return res.data;
};
