import { apiApp } from "../../api/index";
import { ApiResponse, PageResponse } from "../../types/common.type";
import { OrderResponse } from "../../types/order.type";

const BASE_PATH = "/api/orders";

export const getAllOrders = async (params?: {
    page?: number;
    size?: number;
    sortKey?: string;
    sortDirection?: string;
}, signal?: AbortSignal) => {
    const response = await apiApp.get<ApiResponse<PageResponse<OrderResponse>>>(`${BASE_PATH}`, { params, signal });
    return response.data;
};

export const getOrdersByStatus = async (status: string, params?: {
    page?: number;
    size?: number;
    sortKey?: string;
    sortDirection?: string;
}, signal?: AbortSignal) => {
    const response = await apiApp.get<ApiResponse<PageResponse<OrderResponse>>>(`${BASE_PATH}/status/${status}`, { params, signal });
    return response.data;
};

export const getOrderById = async (id: string) => {
    const response = await apiApp.get<ApiResponse<OrderResponse>>(`${BASE_PATH}/${id}`);
    return response.data;
};

export const getOrderByCode = async (code: string) => {
    const response = await apiApp.get<ApiResponse<OrderResponse>>(`${BASE_PATH}/code/${code}`);
    return response.data;
};

export const updateOrderStatus = async (id: string, status: string) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/status?status=${status}`);
    return response.data;
};

export const updateShippingFee = async (id: string, fee: number) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/shipping-fee?finalFee=${fee}`);
    return response.data;
};

export const searchOrders = async (params: {
    keyword: string;
    page?: number;
    size?: number;
    sortKey?: string;
    sortDirection?: string;
}, signal?: AbortSignal) => {
    const response = await apiApp.get<ApiResponse<PageResponse<OrderResponse>>>(`${BASE_PATH}/search`, { params, signal });
    return response.data;
};
