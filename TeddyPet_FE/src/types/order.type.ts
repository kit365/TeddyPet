export type PaymentMethod = "BANK_TRANSFER" | "CASH" | "CREDIT_CARD" | "E_WALLET";

export interface OrderItemRequest {
    variantId: number;
    quantity: number;
}

export interface OrderRequest {
    paymentMethod: PaymentMethod;
    userAddressId?: number;
    receiverName?: string;
    receiverPhone?: string;
    shippingAddress?: string;
    note?: string;
    items: OrderItemRequest[];
    voucherCode?: string;
    guestEmail?: string;
    otpCode?: string;
    latitude?: number;
    longitude?: number;
}

export interface OrderItemResponse {
    id: number;
    productId: number;
    variantId: number;
    productName: string;
    variantName: string;
    imageUrl: string;
    altImage?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface OrderPaymentResponse {
    paymentUrl?: string;
    orderCode: string;
    amount: number;
    status: string;
    paymentMethod: string;
}

export interface OrderResponse {
    id: string;
    orderCode: string;
    user?: {
        fullName: string;
        email: string;
        phoneNumber: string;
    };
    guestEmail?: string;
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    finalAmount: number;
    status: string;
    shippingAddress: string;
    shippingPhone: string;
    shippingName: string;
    notes?: string;
    orderItems: OrderItemResponse[];
    payments: OrderPaymentResponse[];
    distanceKm?: number;
    // Cancellation/Return info
    cancelReason?: string;
    cancelledAt?: string;
    cancelledBy?: string;
    deliveredAt?: string;
    createdAt: string;
    updatedAt: string;
}
