import { apiApp } from "./index";
import { ApiResponse } from "../types/common.type";

export interface FeedbackRequest {
    token?: string;
    orderId?: string;
    productId: number;
    variantId?: number;
    rating: number;
    comment: string;
}

export interface FeedbackResponse {
    id: number;
    userName: string;
    guestName: string;
    productId: number;
    productName: string;
    productSlug: string;
    productImage: string;
    variantId: number;
    variantName: string;
    rating: number;
    comment: string;
    replyComment?: string;
    repliedAt?: string;
    isEdited: boolean;
    isPurchased: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface FeedbackTokenItem {
    productId: number;
    variantId: number;
    productName: string;
    variantName: string;
    imageUrl: string;
    rating?: number;
    comment?: string;
    isSubmitted?: boolean;
}

export interface FeedbackTokenResponse {
    token: string;
    customerName: string;
    customerEmail: string;
    items: FeedbackTokenItem[];
}

const BASE_PATH = "/api/feedbacks";

export const submitFeedback = async (data: FeedbackRequest): Promise<ApiResponse<FeedbackResponse>> => {
    const response = await apiApp.post(BASE_PATH, data);
    return response.data;
};

export const getAllFeedbacks = async (): Promise<ApiResponse<FeedbackResponse[]>> => {
    const response = await apiApp.get(BASE_PATH);
    return response.data;
};

export const updateFeedback = async (id: number, data: FeedbackRequest): Promise<ApiResponse<FeedbackResponse>> => {
    const response = await apiApp.put(`${BASE_PATH}/${id}`, data);
    return response.data;
};

export const replyFeedback = async (id: number, replyComment: string): Promise<ApiResponse<FeedbackResponse>> => {
    const response = await apiApp.put(`${BASE_PATH}/${id}/reply`, { replyComment });
    return response.data;
};

export const editFeedbackAsAdmin = async (id: number, comment: string): Promise<ApiResponse<FeedbackResponse>> => {
    const response = await apiApp.put(`${BASE_PATH}/${id}/admin-edit`, { comment });
    return response.data;
};

export const deleteFeedback = async (id: number): Promise<ApiResponse<string>> => {
    const response = await apiApp.delete(`${BASE_PATH}/${id}`);
    return response.data;
};

export const getProductFeedbacks = async (productId: number): Promise<ApiResponse<FeedbackResponse[]>> => {
    const response = await apiApp.get(`${BASE_PATH}/product/${productId}`);
    return response.data;
};

export const getFeedbackTokenDetails = async (token: string): Promise<ApiResponse<FeedbackTokenResponse>> => {
    const response = await apiApp.get(`${BASE_PATH}/token-details/${token}`);
    return response.data;
};

export const getOrderFeedbackDetails = async (orderId: string, email?: string): Promise<ApiResponse<FeedbackTokenResponse>> => {
    const response = await apiApp.get(`${BASE_PATH}/order-details/${orderId}`, {
        params: { email }
    });
    return response.data;
};

export const getMyFeedbacks = async (): Promise<ApiResponse<FeedbackResponse[]>> => {
    const response = await apiApp.get(`${BASE_PATH}/me`);
    return response.data;
};
