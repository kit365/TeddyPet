import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE_URL = '/api/product-attributes';

/** Header auth dùng chung */
const withAuth = () => {
    const token = Cookies.get('tokenAdmin');

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

/** Lấy danh sách thuộc tính */
export const getProductAttributes = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(BASE_URL, withAuth());
    return response.data;
};

/** Lấy chi tiết thuộc tính */
export const getProductAttributeDetail = async (id: number | string): Promise<ApiResponse<any>> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

/** Tạo thuộc tính */
export const createProductAttribute = async (data: any): Promise<any> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

/** Cập nhật thuộc tính */
export const updateProductAttribute = async (id: number | string, data: any): Promise<any> => {
    const response = await apiApp.put(`${BASE_URL}/${id}`, data, withAuth());
    return response.data;
};

/** Xóa thuộc tính */
export const deleteProductAttribute = async (id: number | string): Promise<any> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

/** Lấy danh sách kiểu hiển thị thuộc tính */
export const getDisplayTypes = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(`${BASE_URL}/display-types`, withAuth());
    return response.data;
};

/** Lấy danh sách đơn vị bán hàng */
export const getSalesUnits = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get('/api/product-variants/sales', withAuth());
    return response.data;
};

/** Lấy danh sách đơn vị đo lường */
export const getMeasurementUnits = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(`${BASE_URL}/measurement`, withAuth());
    return response.data;
};

