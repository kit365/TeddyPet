import { apiApp } from "./index";
import { ApiResponse } from "../types/common.type";
import {
    OrderRequest,
    OrderResponse
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

export const getMyOrderByCode = async (code: string) => {
    const response = await apiApp.get<ApiResponse<OrderResponse>>(`${BASE_PATH}/my-orders/code/${code}`);
    return response.data;
};

export const lookupGuestOrder = async (orderCode: string, email: string) => {
    const response = await apiApp.get<ApiResponse<OrderResponse>>(`${BASE_PATH}/guest/lookup`, {
        params: { orderCode, email }
    });
    return response.data;
};

export const cancelOrder = async (id: string) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/cancel`);
    return response.data;
};
