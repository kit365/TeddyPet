import { apiApp } from "./index";
import { ApiResponse } from "../types/common.type";
import {
    OrderRequest,
    OrderResponse,
    ReturnOrderRequest,
    AdminHandleReturnRequest
} from "../types/order.type";

const BASE_PATH = "/api/orders";

export const createOrder = async (data: OrderRequest) => {
    const response = await apiApp.post<ApiResponse<OrderResponse>>(`${BASE_PATH}`, data);
    return response.data;
};

export const getMyOrders = async () => {
    const response = await apiApp.get<ApiResponse<OrderResponse[]>>(`${BASE_PATH}/my-orders/list`);
    return response.data;
};

export const getMyOrdersPaginated = async (page: number = 0, size: number = 10, status?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (status) params.append('status', status);
    
    const response = await apiApp.get<ApiResponse<{
        content: OrderResponse[];
        totalElements: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    }>>(`${BASE_PATH}/my-orders?${params.toString()}`);
    return response.data;
};

export const getMyOrderById = async (id: string) => {
    const response = await apiApp.get<ApiResponse<OrderResponse>>(`${BASE_PATH}/my-orders/${id}`);
    return response.data;
};

export const downloadMyOrderInvoice = async (id: string) => {
    const response = await apiApp.get(`${BASE_PATH}/my-orders/${id}/invoice/pdf`, {
        responseType: 'blob'
    });
    return response.data;
};

export const getMyOrderByCode = async (code: string) => {
    const response = await apiApp.get<ApiResponse<OrderResponse>>(`${BASE_PATH}/my-orders/code/${code}`);
    return response.data;
};

// Public tracking - chỉ cần orderCode, không cần email
export const trackOrder = async (code: string) => {
    const response = await apiApp.get<ApiResponse<OrderResponse>>(`${BASE_PATH}/track/${code}`);
    return response.data;
};

export const lookupGuestOrder = async (orderCode: string, email: string) => {
    const response = await apiApp.get<ApiResponse<OrderResponse>>(`${BASE_PATH}/guest/lookup`, {
        params: { orderCode, email }
    });
    return response.data;
};

export const cancelOrder = async (id: string, reason: string) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/cancel`, { reason });
    return response.data;
};

export const confirmReceived = async (id: string) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/received`);
    return response.data;
};

// Customer requesting return
export const requestReturn = async (id: string, data: ReturnOrderRequest) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/request-return`, data);
    return response.data;
};

// Admin handling return request
export const handleReturnRequest = async (id: string, data: AdminHandleReturnRequest) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/handle-return`, data);
    return response.data;
};

// Admin marking order as returned directly
export const returnOrder = async (id: string, reason: string) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/return`, { reason });
    return response.data;
};

// Payment integration
export const createPaymentUrl = async (orderId: string, gateway: string, returnUrl?: string) => {
    const response = await apiApp.post<ApiResponse<String>>(`/api/payments/create`, null, {
        params: { orderId, gateway, returnUrl }
    });
    return response.data;
};
