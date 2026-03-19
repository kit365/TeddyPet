package fpt.teddypet.domain.enums.orders;

public enum OrderStatusEnum {
    PENDING,           // Đơn mới - chờ xác nhận giá
    CONFIRMED,         // Đã xác nhận giá với khách, chưa thanh toán
    PAID,              // Đã thanh toán (qua PayOS / online), chờ nhân viên bắt đầu đóng gói
    PROCESSING,        // Đang đóng gói
    DELIVERING,        // Đang giao hàng
    DELIVERED,         // Đã giao thành công (chờ khách xác nhận)
    COMPLETED,         // Hoàn thành
    CANCELLED,         // Đã hủy
    REFUND_PENDING,    // Chờ hoàn tiền (đơn đã hủy, chờ admin xác nhận đã chuyển tiền)
    REFUNDED,          // Đã hoàn tiền (đơn đã hủy và đã xác nhận chuyển khoản xong)
    RETURN_REQUESTED,  // Khách yêu cầu trả hàng (chờ admin duyệt)
    RETURNED           // Hoàn trả (khách boom hàng hoặc trả hàng đã duyệt)
}
