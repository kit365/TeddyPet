import { apiApp } from "./index";
import { ApiResponse } from "../types/common.type";

export interface BlogCommentRequest {
    blogPostId: number;
    content: string;
    parentId?: number;
    guestName?: string;
    guestEmail?: string;
}

export interface BlogCommentResponse {
    id: number;
    blogPostId: number;
    userName?: string;
    guestName?: string;
    content: string;
    parentId?: number;
    createdAt: string;
    replies: BlogCommentResponse[];
}

const BASE_PATH = "/api/blog-comments";

export const createBlogComment = async (data: BlogCommentRequest): Promise<ApiResponse<BlogCommentResponse>> => {
    const response = await apiApp.post(BASE_PATH, data);
    return response.data;
};

export const getBlogComments = async (postId: number): Promise<ApiResponse<BlogCommentResponse[]>> => {
    const response = await apiApp.get(`${BASE_PATH}/post/${postId}`);
    return response.data;
};

export const getAllBlogComments = async (): Promise<ApiResponse<BlogCommentResponse[]>> => {
    const response = await apiApp.get(`${BASE_PATH}/all`);
    return response.data;
};

export const deleteBlogComment = async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiApp.delete(`${BASE_PATH}/${id}`);
    return response.data;
};
