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
    public static final String MESSAGE_ONLINE_PAYMENT_NOT_IMPLEMENTED = "Online payment methods are not yet implemented. Please use CASH payment.";
    public static final String MESSAGE_NOTE_PAYMENT_CASH = "Thanh toán tiền mặt khi nhận hàng";
    public static final String MESSAGE_NOTE_GUEST_COD = "Đơn hàng khách vãng lai - COD";

    // Address Validation
    public static final String MESSAGE_ADDRESS_REQUIRED = "Địa chỉ giao hàng không được để trống";

    // Order Tracking & Status Body
    public static final String MESSAGE_BODY_CONFIRMED = "Đơn hàng của bạn đã được xác nhận phí vận chuyển và đang được chuẩn bị.";
    public static final String MESSAGE_BODY_PROCESSING = "Đơn hàng của bạn đang được đóng gói và chuẩn bị giao.";
    public static final String MESSAGE_BODY_DELIVERING = "Shipper đang giao hàng tới bạn. Vui lòng chú ý địa chỉ và điện thoại để nhận hàng nhé!";
    public static final String MESSAGE_BODY_DELIVERED = "Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua sắm tại TeddyPet!";
    public static final String MESSAGE_BODY_COMPLETED = "Đơn hàng đã hoàn tất. Hẹn gặp lại bạn lần sau!";
    public static final String MESSAGE_BODY_CANCELLED = "Đơn hàng đã bị hủy. Vui lòng liên hệ CSKH nếu có thắc mắc.";

    public static final String STATUS_TEXT_CONFIRMED = "ĐÃ XÁC NHẬN";
    public static final String STATUS_TEXT_PROCESSING = "ĐANG ĐÓNG GÓI";
    public static final String STATUS_TEXT_DELIVERING = "ĐANG GIAO HÀNG";
    public static final String STATUS_TEXT_DELIVERED = "GIAO HÀNG THÀNH CÔNG";
    public static final String STATUS_TEXT_COMPLETED = "ĐÃ HOÀN TẤT";
    public static final String STATUS_TEXT_CANCELLED = "ĐÃ HỦY";
    public static final String STATUS_TEXT_RETURNED = "ĐÃ HOÀN TRẢ";

    // Notes
    public static final String MESSAGE_NOTE_COD_AUTO_COMPLETED = "Đã thu tiền mặt khi giao hàng thành công (COD)";
    public static final String MESSAGE_NOTE_ONLINE_PENDING = "Thanh toán Online - Đang chờ xử lý";
    public static final String MESSAGE_NOTE_CANCEL_BY_CUSTOMER = "Khách hàng hủy đơn: Vô hiệu hóa thanh toán";
    public static final String MESSAGE_NOTE_CANCEL_REFUND_PENDING = "Khách hàng hủy đơn: Chờ hoàn tiền";
    public static final String MESSAGE_NOTE_CANCEL_BY_ADMIN = "Admin hủy đơn: Vô hiệu hóa thanh toán";
    public static final String MESSAGE_NOTE_CANCEL_ADMIN_REFUND = "Admin hủy đơn: Chờ hoàn tiền";
    public static final String MESSAGE_NOTE_RETURN_VOIDED = "Hoàn đơn (Return): Vô hiệu hóa thanh toán";
    public static final String MESSAGE_NOTE_RETURN_REFUND = "Hoàn đơn (Return): Chờ hoàn tiền";

    // Misc
    public static final String MESSAGE_ERROR_RECEIPT_NOT_ALLOWED = "Đơn hàng phải ở trạng thái Đã giao hàng mới có thể xác nhận nhận hàng.";
    public static final String MESSAGE_WAIT_FOR_OTP = "Vui lòng đợi %d giây trước khi gửi lại mã.";
    public static final String MESSAGE_ERROR_CANCEL_INVALID_STATUS = "Chỉ có thể hủy đơn khi đơn hàng đang chờ xác nhận, đã xác nhận hoặc đang đóng gói.";
    public static final String MESSAGE_ERROR_ORDER_ALREADY_CANCELLED = "Đơn hàng đã được hủy hoặc hoàn trả trước đó.";
    public static final String MESSAGE_ERROR_RETURN_INVALID_STATUS = "Chỉ có thể hoàn trả đơn khi đơn hàng đang giao hoặc đã giao.";
    public static final String MESSAGE_BODY_RETURNED_EMAIL = "Đơn hàng đã được hoàn trả. Lý do: %s. Vui lòng liên hệ CSKH nếu có thắc mắc.";
}
