package fpt.teddypet.application.constants.promotions;

public final class PromotionUsageMessages {

    private PromotionUsageMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_PROMOTION_USAGE_RECORDED_SUCCESS = "Ghi nhận sử dụng khuyến mãi thành công.";

    // Error messages
    public static final String MESSAGE_PROMOTION_USAGE_NOT_FOUND = "Không tìm thấy lịch sử sử dụng khuyến mãi.";
    public static final String MESSAGE_PROMOTION_USAGE_NOT_FOUND_BY_ID = "Không tìm thấy lịch sử sử dụng khuyến mãi với ID: %s";
    public static final String MESSAGE_PROMOTION_USAGE_LIMIT_PER_USER_REACHED = "Bạn đã đạt giới hạn sử dụng khuyến mãi này.";
    public static final String MESSAGE_PROMOTION_USAGE_ALREADY_EXISTS = "Lịch sử sử dụng khuyến mãi đã tồn tại.";
}
