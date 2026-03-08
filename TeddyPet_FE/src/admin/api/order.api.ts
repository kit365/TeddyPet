import { apiApp } from "../../api/index";
import { ApiResponse, PageResponse } from "../../types/common.type";
import { OrderResponse, AdminHandleReturnRequest } from "../../types/order.type";

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

export const downloadOrderInvoice = async (id: string) => {
    const response = await apiApp.get(`${BASE_PATH}/${id}/invoice/pdf`, {
        responseType: 'blob'
    });
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

// Admin cancel order (PENDING or CONFIRMED status only)
export const cancelOrderByAdmin = async (id: string, reason: string) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/admin-cancel`, { reason });
    return response.data;
};

// Return order (DELIVERING or DELIVERED status - customer boom/return)
export const returnOrder = async (id: string, reason: string) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/return`, { reason });
    return response.data;
};

// Admin handle return request from customer
export const handleReturnRequest = async (id: string, data: AdminHandleReturnRequest) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/handle-return`, data);
    return response.data;
};

// Export orders to Excel
export const exportOrdersToExcel = async () => {
    const response = await apiApp.get(`${BASE_PATH}/export`, {
        responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const importOrdersFromExcel = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiApp.post<ApiResponse<any>>(`${BASE_PATH}/excel/import`, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
};

export const downloadOrderTemplate = async () => {
    const response = await apiApp.get(`${BASE_PATH}/excel/template`, {
        responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_template.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
