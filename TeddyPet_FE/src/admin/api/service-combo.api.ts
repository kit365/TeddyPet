import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';
import { IServiceCombo } from '../pages/service/configs/types';

const BASE_URL = '/api/service-combos';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export const getServiceCombos = async (): Promise<ApiResponse<IServiceCombo[]>> => {
    const response = await apiApp.get(BASE_URL, withAuth());
    return response.data;
};

export const getServiceComboById = async (id: string | number): Promise<ApiResponse<IServiceCombo>> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

export const createOrUpdateServiceCombo = async (data: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

export const deleteServiceCombo = async (id: string | number): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};
