export const ORDER_STATUS_MAP: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
    PENDING: {
        label: "Chờ xác nhận",
        color: "#B76E00",
        bgColor: "rgba(255, 171, 0, 0.12)",
        dotColor: "#FFAB00"
    },
    CONFIRMED: {
        label: "Đã xác nhận",
        color: "#006C9C",
        bgColor: "rgba(0, 184, 217, 0.12)",
        dotColor: "#00B8D9"
    },
    PAID: {
        label: "Đã thanh toán",
        color: "#118D57",
        bgColor: "rgba(34, 197, 94, 0.12)",
        dotColor: "#22C55E"
    },
    PROCESSING: {
        label: "Đang đóng gói",
        color: "#118D57",
        bgColor: "rgba(34, 197, 94, 0.12)",
        dotColor: "#22C55E"
    },
    DELIVERING: {
        label: "Đang giao",
        color: "#1064ad",
        bgColor: "rgba(16, 100, 173, 0.12)",
        dotColor: "#1064ad"
    },
    DELIVERED: {
        label: "Đã giao",
        color: "#118D57",
        bgColor: "rgba(34, 197, 94, 0.12)",
        dotColor: "#22C55E"
    },
    COMPLETED: {
        label: "Hoàn thành",
        color: "#118D57",
        bgColor: "rgba(34, 197, 94, 0.12)",
        dotColor: "#22C55E"
    },
    CANCELLED: {
        label: "Đã hủy",
        color: "#B71D18",
        bgColor: "rgba(255, 86, 48, 0.12)",
        dotColor: "#FF5630"
    },
    REFUND_PENDING: {
        label: "Chờ hoàn tiền",
        color: "#B76E00",
        bgColor: "rgba(255, 171, 0, 0.12)",
        dotColor: "#FFAB00"
    },
    REFUNDED: {
        label: "Đã hoàn tiền",
        color: "#006C9C",
        bgColor: "rgba(0, 184, 217, 0.12)",
        dotColor: "#00B8D9"
    },
    RETURNED: {
        label: "Hoàn trả",
        color: "#B76E00",
        bgColor: "rgba(255, 171, 0, 0.12)",
        dotColor: "#FFAB00"
    },
    RETURN_REQUESTED: {
        label: "Yêu cầu trả",
        color: "#006C9C",
        bgColor: "rgba(0, 184, 217, 0.12)",
        dotColor: "#00B8D9"
    }
};

export const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: {
        label: "Chờ thanh toán",
        color: "#B76E00",
        bgColor: "rgba(255, 171, 0, 0.12)"
    },
    COMPLETED: {
        label: "Đã thanh toán",
        color: "#00A76F",
        bgColor: "rgba(0, 167, 111, 0.12)"
    },
    VOIDED: {
        label: "Vô hiệu",
        color: "#637381",
        bgColor: "rgba(145, 158, 171, 0.16)"
    },
    REFUND_PENDING: {
        label: "Chờ hoàn",
        color: "#B76E00",
        bgColor: "rgba(255, 171, 0, 0.12)"
    },
    REFUNDED: {
        label: "Đã hoàn",
        color: "#006C9C",
        bgColor: "rgba(0, 184, 217, 0.12)"
    },
    FAILED: {
        label: "Lỗi",
        color: "#FF5630",
        bgColor: "rgba(255, 86, 48, 0.12)"
    },
    DEFAULT: {
        label: "Chưa trả",
        color: "#FF5630",
        bgColor: "rgba(255, 86, 48, 0.12)"
    }
};

export const REFUND_STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: {
        label: "Chờ duyệt",
        color: "#B76E00",
        bgColor: "rgba(255, 171, 0, 0.12)"
    },
    APPROVED: {
        label: "Chờ hoàn tiền",
        color: "#118D57",
        bgColor: "rgba(34, 197, 94, 0.12)"
    },
    REFUNDED: {
        label: "Đã hoàn tiền",
        color: "#006C9C",
        bgColor: "rgba(0, 184, 217, 0.12)"
    },
    REJECTED: {
        label: "Từ chối",
        color: "#B71D18",
        bgColor: "rgba(255, 86, 48, 0.12)"
    },
    ACTION_REQUIRED: {
        label: "Cần cập nhật thông tin",
        color: "#B76E00",
        bgColor: "rgba(255, 171, 0, 0.12)"
    }
};

export const getOrderStatus = (status: string) => {
    return ORDER_STATUS_MAP[status] || { label: status, color: "#637381", bgColor: "rgba(145, 158, 171, 0.16)", dotColor: "#919EAB" };
};

export const getPaymentStatus = (status: string) => {
    return PAYMENT_STATUS_MAP[status] || PAYMENT_STATUS_MAP.DEFAULT;
};

export const getRefundStatus = (status: string | null | undefined) => {
    if (!status) return null;
    return REFUND_STATUS_MAP[status] || { label: status, color: "#637381", bgColor: "rgba(145, 158, 171, 0.16)" };
};
