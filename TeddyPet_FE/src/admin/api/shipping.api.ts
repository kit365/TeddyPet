import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';
import { ShippingRule, CreateShippingRuleRequest, UpdateShippingRuleRequest } from '../../types/shipping.type';

const BASE_URL = '/api/shipping';

/** Header auth dùng chung */
const withAuth = () => {
    const token = Cookies.get('tokenAdmin');

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// --- SHIPPING RULES ADMIN API ---

export const getShippingRules = async (): Promise<ApiResponse<ShippingRule[]>> => {
    const response = await apiApp.get(`${BASE_URL}/rules`, withAuth());
    return response.data;
};

export const createShippingRule = async (data: CreateShippingRuleRequest): Promise<ApiResponse<ShippingRule>> => {
    const response = await apiApp.post(`${BASE_URL}/rules`, data, withAuth());
    return response.data;
};

export const updateShippingRule = async (id: number, data: UpdateShippingRuleRequest): Promise<ApiResponse<ShippingRule>> => {
    const response = await apiApp.put(`${BASE_URL}/rules/${id}`, data, withAuth());
    return response.data;
};

export const deleteShippingRule = async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiApp.delete(`${BASE_URL}/rules/${id}`, withAuth());
    return response.data;
};

export const getShippingFeeSuggestion = async (distance: number, provinceId: number, orderTotal?: number, weight?: number): Promise<ApiResponse<any>> => {
    const response = await apiApp.get(`${BASE_URL}/suggestion`, {
        ...withAuth(),
        params: { distance, provinceId, orderTotal, weight }
    });
    return response.data;
};
