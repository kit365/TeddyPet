import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { BlogCategoryNode } from '../components/ui/CategoryTreeSelect';
import { ApiResponse } from '../config/type';

const BASE_URL = '/api/product-categories';

/** Header auth dùng chung cho product-categories */
const withAuth = () => {
    const token = Cookies.get('tokenAdmin');

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
    console.log('Fetching nested product categories...');
    const response = await apiApp.get(`${BASE_URL}/nested`);
    return response.data;
};

/** Tạo danh mục */
export const createCategory = async (data: any): Promise<any> => {
    // Backend uses @PutMapping for both create and update
    const response = await apiApp.put(BASE_URL, data, withAuth());
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

// ─── Excel ───────────────────────────────────────────────────────────────

/** Xuất danh mục sản phẩm ra Excel */
export const exportCategoriesExcel = async (): Promise<Blob> => {
    const response = await apiApp.get(`${BASE_URL}/excel/export`, {
        ...withAuth(),
        responseType: 'blob',
    });
    return response.data;
};

/** Tải template Excel để nhập danh mục */
export const downloadCategoriesTemplate = async (): Promise<Blob> => {
    const response = await apiApp.get(`${BASE_URL}/excel/template`, {
        ...withAuth(),
        responseType: 'blob',
    });
    return response.data;
};

/** Nhập danh mục từ file Excel */
export const importCategoriesExcel = async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiApp.post(`${BASE_URL}/excel/import`, formData, {
        headers: {
            ...withAuth().headers,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
