export type PaymentMethod = "BANK_TRANSFER" | "CASH" | "CREDIT_CARD" | "E_WALLET";

/** ONLINE = đặt online (cần địa chỉ, phí ship); OFFLINE = tại quầy */
export type OrderType = "ONLINE" | "OFFLINE";

export interface OrderItemRequest {
    variantId: number;
    quantity: number;
}

export interface OrderRequest {
    paymentMethod: PaymentMethod;
    /** Loại đơn: ONLINE (mặc định) hoặc OFFLINE (tại quầy) */
    orderType?: OrderType;
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
    orderType?: OrderType;
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
    completedAt?: string;
    returnReason?: string;
    returnEvidence?: string;
    returnRequestedAt?: string;
    adminReturnNote?: string;
    /** Trạng thái yêu cầu hoàn tiền gần nhất (nếu có) */
    latestRefundStatus?: "PENDING" | "APPROVED" | "REFUNDED" | "REJECTED" | "CANCELLED" | "ACTION_REQUIRED";
    /** ID yêu cầu hoàn tiền gần nhất (nếu có) */
    latestRefundId?: number;
    /** Mã giao dịch hoàn tiền (nếu approved/refunded) */
    refundTransactionId?: string;
    /** Danh sách ảnh bằng chứng hoàn tiền từ phía admin */
    adminRefundEvidenceUrls?: string[];
    /** Ghi chú hoàn tiền từ phía admin */
    adminRefundNote?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReturnOrderRequest {
    reason: string;
    evidenceUrls?: string[];
}

export interface AdminHandleReturnRequest {
    approved: boolean;
    adminNote?: string;
}

export interface OrderRefundResponse {
    id: number;
    status: string;
    requestedAmount: number;
    currency: string;
    customerReason: string;
    evidenceUrls?: string | null;
    adminDecisionNote?: string | null;
    processedBy?: string | null;
    refundTransactionId?: string | null;
    adminEvidenceUrls?: string[];
    bankName?: string | null;
    bankCode?: string | null;
    accountNumber?: string | null;
    accountHolderName?: string | null;
    createdAt: string;
    processedAt?: string | null;
    refundCompletedAt?: string | null;
}
