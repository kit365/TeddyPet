import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { BlogCategoryNode } from '../components/ui/CategoryTreeSelect';
import { ApiResponse } from '../config/type';

const BASE_URL = '/api/product-categories';

/** Header auth dùng chung cho product-categories */
const withAuth = () => {
    const token = Cookies.get('token');

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

/** Danh sách (flat) */
export const getCategories = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(BASE_URL, withAuth());
    return response.data;
};

export const getNestedCategories = async (): Promise<ApiResponse<BlogCategoryNode[]>> => {
    const token = Cookies.get('token');
    const response = await apiApp.get('/api/product-categories/nested', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

/** Tạo danh mục */
export const createCategory = async (data: any): Promise<any> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

/** Chi tiết */
export const getCategoryById = async (id: string | number): Promise<any> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

/** Xóa */
export const deleteCategory = async (id: string | number): Promise<any> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};