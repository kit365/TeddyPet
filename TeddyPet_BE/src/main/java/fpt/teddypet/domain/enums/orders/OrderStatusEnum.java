package fpt.teddypet.domain.enums.orders;

public enum OrderStatusEnum {
    PENDING, // Đơn mới - chờ xác nhận giá
    CONFIRMED, // Đã xác nhận giá với khách
    PROCESSING, // Đang đóng gói
    DELIVERING, // Đang giao hàng
    DELIVERED, // Đã giao thành công (chờ khách xác nhận)
    COMPLETED, // Hoàn thành
    CANCELLED, // Đã hủy
    RETURN_REQUESTED, // Khách yêu cầu trả hàng (chờ admin duyệt)
    RETURNED // Hoàn trả (khách boom hàng hoặc trả hàng đã duyệt)
}
