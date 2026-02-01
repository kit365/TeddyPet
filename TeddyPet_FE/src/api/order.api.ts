import { apiApp } from "./index";

export interface OrderItemRequest {
    variantId: number;
    quantity: number;
}

export interface OrderRequest {
    paymentMethod: "BANK_TRANSFER" | "CASH_ON_DELIVERY";
    userAddressId?: number;
    receiverName?: string;
    receiverPhone?: string;
    shippingAddress?: string;
    note?: string;
    items: OrderItemRequest[];
    voucherCode?: string;
    guestEmail?: string;
    otpCode?: string;
}

export interface OrderResponse {
    id: string;
    orderCode: string;
    userId?: string;
    receiverName: string;
    receiverPhone: string;
    shippingAddress: string;
    note?: string;
    paymentMethod: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const createOrder = async (data: OrderRequest) => {
    const response = await apiApp.post<{ success: boolean; message: string; data: OrderResponse }>("/orders", data);
    return response.data;
};

export const getMyOrders = async () => {
    const response = await apiApp.get<{ success: boolean; data: OrderResponse[] }>("/orders/my-orders/list");
    return response.data;
};

export const getMyOrderByCode = async (code: string) => {
    const response = await apiApp.get<{ success: boolean; data: OrderResponse }>(`/orders/my-orders/code/${code}`);
    return response.data;
};

export const cancelOrder = async (id: string) => {
    const response = await apiApp.patch<{ success: boolean; message: string }>(`/orders/${id}/cancel`);
    return response.data;
};
