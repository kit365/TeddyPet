import type { OrderResponse } from "../../types/order.type";

/**
 * Phí ship:
 * - Đơn **PENDING** (chưa chốt phí) → "Liên hệ sau".
 * - Từ **CONFIRMED** trở đi (shop đã xác nhận / chốt đơn) → luôn hiển thị số tiền;
 *   nếu API không gửi `shippingFee` thì coi là **0đ** (miễn phí / đã gộp), không hiện "Liên hệ sau".
 */
export function getOrderShippingFeeLabel(
    order: Pick<OrderResponse, "status" | "shippingFee">,
    opts?: { withPlusPrefix?: boolean }
): string {
    if (order.status === "PENDING") {
        return "Liên hệ sau";
    }
    const raw = order.shippingFee;
    const n = raw == null || Number.isNaN(Number(raw)) ? 0 : Number(raw);
    const formatted = `${n.toLocaleString("vi-VN")}đ`;
    if (opts?.withPlusPrefix && n > 0) {
        return `+${formatted}`;
    }
    return formatted;
}
