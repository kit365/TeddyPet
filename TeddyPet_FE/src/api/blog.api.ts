import { apiApp } from "./index";
import Cookies from 'js-cookie';

const BASE_URL = "/api/blog-posts";

/** Header auth dùng chung */
const withAuth = () => {
    const token = Cookies.get('token');
    if (!token) return {};

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const getPublicBlogs = async (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    categoryId?: number | string;
    tagId?: number | string;
    sortKey?: string;
    sortDirection?: string;
}) => {
    const response = await apiApp.get(BASE_URL, {
        ...withAuth(),
        params: {
            ...params,
            status: 'PUBLISHED' // Chỉ lấy bài viết đã xuất bản
        }
    });
    return response.data;
};

export const getPublicBlogById = async (id: string | number) => {
    const response = await apiApp.get(`${BASE_URL}/${id}`, withAuth());
    return response.data;
};

export const getPublicBlogBySlug = async (slug: string) => {
    const response = await apiApp.get(`${BASE_URL}/slug/${slug}`, withAuth());
    return response.data;
};


