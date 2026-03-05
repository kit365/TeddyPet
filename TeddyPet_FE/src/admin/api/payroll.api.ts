import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE = '/api/staff/payroll';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export type PayrollStatus = 'DRAFT' | 'CONFIRMED' | 'PAID';

export interface ISalaryLog {
    id: number;
    staffId: number;
    staffName: string;
    month: number;
    year: number;
    totalMinutes: number;
    baseSalaryAmount: number;
    totalCommission: number;
    totalDeduction: number;
    finalSalary: number;
    status: PayrollStatus;
}

export interface IPayrollRunRequest {
    month: number;
    year: number;
    staffId?: number | null;
}

export const runPayroll = async (data: IPayrollRunRequest): Promise<ApiResponse<ISalaryLog[]>> => {
    const res = await apiApp.post(`${BASE}/run`, data, withAuth());
    return res.data;
};

export const getPayrollByMonthYear = async (
    month: number,
    year: number,
    staffId?: number | null
): Promise<ApiResponse<ISalaryLog[]>> => {
    const params: { month: number; year: number; staffId?: number } = { month, year };
    if (staffId != null) params.staffId = staffId;
    const res = await apiApp.get(BASE, { ...withAuth(), params });
    return res.data;
};
