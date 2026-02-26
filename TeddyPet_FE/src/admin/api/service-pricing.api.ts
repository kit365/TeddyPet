import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';
import { IServicePricing } from '../pages/service/configs/types';

const BASE_URL = '/api/service-pricings';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export const getServicePricingsByServiceId = async (serviceId: number): Promise<ApiResponse<IServicePricing[]>> => {
    const response = await apiApp.get(`${BASE_URL}?serviceId=${serviceId}`, withAuth());
    return response.data;
};

export const getServicePricingById = async (id: string | number): Promise<ApiResponse<IServicePricing>> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

export const createOrUpdateServicePricing = async (data: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

export const deleteServicePricing = async (id: string | number): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};
