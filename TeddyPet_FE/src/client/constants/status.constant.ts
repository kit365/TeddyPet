export const ORDER_STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: {
        label: "Đang chờ xử lý",
        color: "#B76E00",
        bgColor: "rgba(255, 171, 0, 0.16)"
    },
    CONFIRMED: {
        label: "Đã xác nhận",
        color: "#006C9C",
        bgColor: "rgba(0, 184, 217, 0.16)"
    },
    SHIPPED: {
        label: "Đã gửi hàng",
        color: "#006C9C",
        bgColor: "rgba(0, 184, 217, 0.16)"
    },
    DELIVERING: {
        label: "Đang giao hàng",
        color: "#1064ad",
        bgColor: "rgba(16, 100, 173, 0.16)"
    },
    DELIVERED: {
        label: "Đã nhận hàng",
        color: "#118D57",
        bgColor: "rgba(34, 197, 94, 0.16)"
    },
    COMPLETED: {
        label: "Hoàn thành",
        color: "#05A845",
        bgColor: "rgba(34, 197, 94, 0.16)"
    },
    CANCELLED: {
        label: "Đã hủy",
        color: "#B71D18",
        bgColor: "rgba(255, 86, 48, 0.16)"
    },
};

export const getOrderStatus = (status: string) => {
    return ORDER_STATUS_MAP[status] || { label: status, color: "#637381", bgColor: "rgba(145, 158, 171, 0.16)" };
};
