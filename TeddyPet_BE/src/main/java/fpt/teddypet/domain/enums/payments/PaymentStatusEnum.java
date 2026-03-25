package fpt.teddypet.domain.enums.payments;

public enum PaymentStatusEnum {
    PENDING, // Chờ thanh toán
    PROCESSING, // Đang xử lý
    COMPLETED, // Đã thanh toán
    FAILED, // Thanh toán thất bại
    VOIDED, // Vô hiệu (đơn bị hủy, không phát sinh giao dịch)
    REFUND_PENDING, // Chờ hoàn tiền
    REFUNDED // Đã hoàn tiền
}
