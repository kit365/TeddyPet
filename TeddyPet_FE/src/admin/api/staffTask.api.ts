import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';
import type { EmployeeTask } from '../types/employeeDashboard';

const BASE = '/api/staff/tasks';

const withAuth = () => ({
    headers: { Authorization: `Bearer ${Cookies.get('tokenAdmin')}` },
});

export const getTodayStaffTasks = async (): Promise<ApiResponse<EmployeeTask[]>> => {
    const res = await apiApp.get(`${BASE}/today`, withAuth());
    return res.data;
};
