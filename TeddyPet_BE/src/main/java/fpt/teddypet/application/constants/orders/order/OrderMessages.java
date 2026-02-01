package fpt.teddypet.application.constants.orders.order;

public final class OrderMessages {

    private OrderMessages() {
    }

    // Success
    public static final String MESSAGE_ORDER_CREATED_SUCCESS = "Tạo đơn hàng thành công.";
    public static final String MESSAGE_ORDER_UPDATED_SUCCESS = "Cập nhật đơn hàng thành công.";
    public static final String MESSAGE_ORDER_CANCELLED_SUCCESS = "Hủy đơn hàng thành công.";
    public static final String MESSAGE_ORDER_STATUS_UPDATED_SUCCESS = "Cập nhật trạng thái đơn hàng thành công.";

    // Error - General
    public static final String MESSAGE_ORDER_NOT_FOUND = "Không tìm thấy đơn hàng.";
    public static final String MESSAGE_ORDER_NOT_FOUND_BY_ID = "Không tìm thấy đơn hàng với ID: %s";
    public static final String MESSAGE_ORDER_NOT_FOUND_BY_CODE = "Không tìm thấy đơn hàng với mã: %s";
    public static final String MESSAGE_ORDER_ACCESS_DENIED = "Bạn không có quyền truy cập đơn hàng này.";
    public static final String MESSAGE_ORDER_CANNOT_CANCEL = "Không thể hủy đơn hàng ở trạng thái hiện tại.";
    public static final String MESSAGE_ORDER_EMPTY = "Đơn hàng không có sản phẩm.";
    public static final String MESSAGE_ORDER_INVALID_PAYMENT_METHOD = "Phương thức thanh toán không hợp lệ. Hiện chỉ hỗ trợ thanh toán tiền mặt (CASH).";
    public static final String MESSAGE_ORDER_EMPTY_ITEMS = "Đơn hàng phải có ít nhất 1 sản phẩm.";
    public static final String MESSAGE_ORDER_VARIANT_NOT_AVAILABLE = "Sản phẩm %s không còn khả dụng.";
    public static final String MESSAGE_ORDER_INSUFFICIENT_STOCK = "Sản phẩm %s không đủ hàng. Còn lại: %d";
    public static final String MESSAGE_USER_NOT_VERIFIED = "Tài khoản chưa xác thực email. Vui lòng xác thực trước khi đặt hàng.";
    public static final String MESSAGE_GUEST_EMAIL_EXISTS = "Email này đã được đăng ký thành viên. Vui lòng đăng nhập để đặt hàng và tích điểm.";

    // Error - Guest checkout validation
    public static final String MESSAGE_GUEST_EMAIL_REQUIRED = "Email là bắt buộc cho khách vãng lai.";
    public static final String MESSAGE_OTP_REQUIRED = "Mã xác thực (OTP) là bắt buộc cho khách vãng lai.";
    public static final String MESSAGE_OTP_INVALID = "Mã xác thực (OTP) không chính xác hoặc đã hết hạn.";
    public static final String MESSAGE_RECEIVER_NAME_REQUIRED = "Tên người nhận là bắt buộc.";
    public static final String MESSAGE_RECEIVER_PHONE_REQUIRED = "Số điện thoại người nhận là bắt buộc.";
    public static final String MESSAGE_SHIPPING_ADDRESS_REQUIRED = "Địa chỉ giao hàng là bắt buộc.";
    public static final String MESSAGE_GUEST_ORDER_NOT_FOUND = "Không tìm thấy đơn hàng với mã và email đã nhập.";
    public static final String MESSAGE_GUEST_PAYMENT_COD_ONLY = "Khách vãng lai chỉ hỗ trợ thanh toán khi nhận hàng (COD).";
}
