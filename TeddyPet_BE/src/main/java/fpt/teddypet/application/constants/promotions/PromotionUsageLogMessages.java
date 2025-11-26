package fpt.teddypet.application.constants.promotions;

public final class PromotionUsageLogMessages {

    private PromotionUsageLogMessages() {
        // Utility class - prevent instantiation
    }

    // Log messages for record usage
    public static final String LOG_PROMOTION_USAGE_RECORD_START = "Bắt đầu ghi nhận sử dụng khuyến mãi. User ID: {}, Promotion ID: {}";
    public static final String LOG_PROMOTION_USAGE_RECORD_SUCCESS = "Ghi nhận sử dụng khuyến mãi thành công. Usage ID: {}";
    public static final String LOG_PROMOTION_USAGE_INCREMENT = "Tăng số lần sử dụng cho user. User ID: {}, Promotion ID: {}, Count: {}";

    // Log messages for get
    public static final String LOG_PROMOTION_USAGE_GET_BY_ID = "Lấy lịch sử sử dụng khuyến mãi theo ID: {}";
    public static final String LOG_PROMOTION_USAGE_GET_BY_USER = "Lấy lịch sử sử dụng khuyến mãi của user ID: {}, số lượng: {}";
    public static final String LOG_PROMOTION_USAGE_GET_BY_PROMOTION = "Lấy lịch sử sử dụng khuyến mãi ID: {}, số lượng: {}";
    public static final String LOG_PROMOTION_USAGE_CHECK_LIMIT = "Kiểm tra giới hạn sử dụng. User ID: {}, Promotion ID: {}, Count: {}, Limit: {}";

    // Log messages for validation
    public static final String LOG_PROMOTION_USAGE_VALIDATION_FAILED = "Validation sử dụng khuyến mãi thất bại. User ID: {}, Promotion ID: {}";
}
