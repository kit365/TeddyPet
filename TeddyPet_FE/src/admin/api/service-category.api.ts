import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';
import { IServiceCategory, IServiceCategoryNode } from '../pages/service/configs/types';

const BASE_URL = '/api/service-categories';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export const getServiceCategories = async (): Promise<ApiResponse<IServiceCategory[]>> => {
    const response = await apiApp.get(BASE_URL, withAuth());
    return response.data;
};

export const getNestedServiceCategories = async (): Promise<ApiResponse<IServiceCategoryNode[]>> => {
    const response = await apiApp.get(`${BASE_URL}/nested`, withAuth());
    return response.data;
};

export const getServiceCategoryById = async (id: string | number): Promise<ApiResponse<IServiceCategory>> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

export const getServiceCategoryChildren = async (id: string | number): Promise<ApiResponse<IServiceCategory[]>> => {
    const response = await apiApp.get(`${BASE_URL}/${id}/children`, withAuth());
    return response.data;
};

export const createOrUpdateServiceCategory = async (data: {
    categoryId?: number | null;
    name: string;
    description?: string;
    serviceType?: string;
    pricingModel?: string;
    metaTitle?: string;
    metaDescription?: string;
    icon?: string;
    imageUrl?: string;
    colorCode?: string;
    isActive?: boolean;
    parentId?: number | null;
    displayOrder?: number;
}): Promise<ApiResponse<IServiceCategory>> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

export const deleteServiceCategory = async (id: string | number): Promise<ApiResponse<unknown>> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};
