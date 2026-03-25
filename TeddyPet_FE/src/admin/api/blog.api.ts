import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const BASE_URL = '/api/blog-posts';
const TAGS_URL = '/api/blog-tags';

/** Header auth dùng chung */
const withAuth = () => {
    const token = Cookies.get('tokenAdmin');

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

/** Lấy tất cả bài viết */
export const getBlogs = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(BASE_URL, withAuth());
    return response.data;
};

/** Lấy bài viết theo ID */
export const getBlogById = async (id: string | number): Promise<any> => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

/** Tạo bài viết */
export const createBlog = async (data: any): Promise<any> => {
    const response = await apiApp.post(BASE_URL, data, withAuth());
    return response.data;
};

/** Cập nhật bài viết */
export const updateBlog = async (id: string | number, data: any): Promise<any> => {
    const response = await apiApp.put(`${BASE_URL}/${id}`, data, withAuth());
    return response.data;
};

/** Xóa bài viết */
export const deleteBlog = async (id: string | number): Promise<any> => {
    const response = await apiApp.delete(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

// --- TAGS API ---

/** Lấy danh sách Tags */
export const getBlogTags = async (): Promise<ApiResponse<any[]>> => {
    const response = await apiApp.get(TAGS_URL, withAuth());
    return response.data;
};

/** Tạo Tag */
export const createBlogTag = async (data: { name: string }): Promise<any> => {
    const response = await apiApp.post(TAGS_URL, data, withAuth());
    return response.data;
};

/** Xóa Tag */
export const deleteBlogTag = async (id: string | number): Promise<any> => {
    const response = await apiApp.delete(`${TAGS_URL}/${id}`, withAuth());
    return response.data;
};
