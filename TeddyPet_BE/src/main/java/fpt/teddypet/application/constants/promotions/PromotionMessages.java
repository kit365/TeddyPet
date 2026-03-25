package fpt.teddypet.application.constants.promotions;

public final class PromotionMessages {

    private PromotionMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_PROMOTION_CREATED_SUCCESS = "Tạo khuyến mãi thành công.";
    public static final String MESSAGE_PROMOTION_UPDATED_SUCCESS = "Cập nhật khuyến mãi thành công.";
    public static final String MESSAGE_PROMOTION_DELETED_SUCCESS = "Xóa khuyến mãi thành công.";
    public static final String MESSAGE_PROMOTION_ACTIVATED_SUCCESS = "Kích hoạt khuyến mãi thành công.";
    public static final String MESSAGE_PROMOTION_DEACTIVATED_SUCCESS = "Hủy kích hoạt khuyến mãi thành công.";

    // Error messages
    public static final String MESSAGE_PROMOTION_NOT_FOUND = "Không tìm thấy khuyến mãi.";
    public static final String MESSAGE_PROMOTION_NOT_FOUND_BY_ID = "Không tìm thấy khuyến mãi với ID: %s";
    public static final String MESSAGE_PROMOTION_NOT_FOUND_BY_CODE = "Không tìm thấy khuyến mãi với mã: %s";
    public static final String MESSAGE_PROMOTION_CODE_ALREADY_EXISTS = "Mã khuyến mãi đã được sử dụng.";
    public static final String MESSAGE_PROMOTION_EXPIRED = "Khuyến mãi đã hết hạn.";
    public static final String MESSAGE_PROMOTION_NOT_STARTED = "Khuyến mãi chưa bắt đầu.";
    public static final String MESSAGE_PROMOTION_USAGE_LIMIT_REACHED = "Khuyến mãi đã đạt giới hạn sử dụng.";
    public static final String MESSAGE_PROMOTION_INACTIVE = "Khuyến mãi không còn hoạt động.";
    public static final String MESSAGE_PROMOTION_INVALID_DATE_RANGE = "Ngày kết thúc phải sau ngày bắt đầu.";

    // Validation response messages (for API responses)
    public static final String MESSAGE_PROMOTION_VALID = "Áp dụng khuyến mãi thành công.";
    public static final String MESSAGE_PROMOTION_NOT_VALID = "Khuyến mãi không còn hiệu lực.";
    public static final String MESSAGE_PROMOTION_USER_LIMIT_REACHED = "Bạn đã đạt giới hạn sử dụng cho khuyến mãi này.";
    public static final String MESSAGE_PROMOTION_MIN_ORDER_NOT_MET = "Tổng đơn hàng không đạt yêu cầu tối thiểu.";
    public static final String MESSAGE_PROMOTION_CODE_NOT_EXIST = "Mã khuyến mãi không tồn tại.";
}
