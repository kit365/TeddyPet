package fpt.teddypet.application.constants.orders.order;

public final class OrderMessages {

    private OrderMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_ORDER_CREATED_SUCCESS = "Tạo đơn hàng thành công.";
    public static final String MESSAGE_ORDER_UPDATED_SUCCESS = "Cập nhật đơn hàng thành công.";
    public static final String MESSAGE_ORDER_CANCELLED_SUCCESS = "Hủy đơn hàng thành công.";
    public static final String MESSAGE_ORDER_STATUS_UPDATED_SUCCESS = "Cập nhật trạng thái đơn hàng thành công.";

    // Error messages
    public static final String MESSAGE_ORDER_NOT_FOUND = "Không tìm thấy đơn hàng.";
    public static final String MESSAGE_ORDER_NOT_FOUND_BY_ID = "Không tìm thấy đơn hàng với ID: %s";
    public static final String MESSAGE_ORDER_NOT_FOUND_BY_CODE = "Không tìm thấy đơn hàng với mã: %s";
    public static final String MESSAGE_ORDER_ACCESS_DENIED = "Bạn không có quyền truy cập đơn hàng này.";
    public static final String MESSAGE_ORDER_CANNOT_CANCEL = "Không thể hủy đơn hàng ở trạng thái hiện tại.";
    public static final String MESSAGE_ORDER_EMPTY = "Đơn hàng không có sản phẩm.";
    public static final String MESSAGE_ORDER_INVALID_PAYMENT_METHOD = "Phương thức thanh toán không hợp lệ. Hiện chỉ hỗ trợ thanh toán tiền mặt (CASH).";
    public static final String MESSAGE_ORDER_EMPTY_ITEMS = "Đơn hàng phải có ít nhất 1 sản phẩm.";
    public static final String MESSAGE_ORDER_VARIANT_NOT_AVAILABLE = "Sản phẩm %s không khả dụng.";
    public static final String MESSAGE_ORDER_INSUFFICIENT_STOCK = "Sản phẩm %s không đủ hàng. Còn lại: %d";
}
