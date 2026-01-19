import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE_URL = '/api/product-brands';

/** Header auth dùng chung */
const withAuth = () => {
    const token = Cookies.get('token');

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

/** Lấy tất cả thương hiệu sản phẩm */
export const getBrands = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(BASE_URL, withAuth());
    return response.data;
};

/** Lấy thương hiệu sản phẩm theo ID */
export const getBrandById = async (id: string | number): Promise<any> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

/** Tạo thương hiệu sản phẩm */
export const createBrand = async (data: any): Promise<any> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

/** Cập nhật thương hiệu sản phẩm */
// Note: Using PUT as per inferred requirement for Brand
export const updateBrand = async (id: string | number, data: any): Promise<any> => {
    const response = await apiApp.put(`${BASE_URL}/${id}`, data, withAuth());
    return response.data;
};

/** Xóa thương hiệu sản phẩm */
export const deleteBrand = async (id: string | number): Promise<any> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};
