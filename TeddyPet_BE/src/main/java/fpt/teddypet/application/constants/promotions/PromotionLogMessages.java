package fpt.teddypet.application.constants.promotions;

public final class PromotionLogMessages {

    private PromotionLogMessages() {
        // Utility class - prevent instantiation
    }

    // Log messages for create/update
    public static final String LOG_PROMOTION_CREATE_START = "Bắt đầu tạo khuyến mãi với mã: {}";
    public static final String LOG_PROMOTION_CREATE_SUCCESS = "Tạo khuyến mãi thành công. Promotion ID: {}";
    public static final String LOG_PROMOTION_UPDATE_START = "Bắt đầu cập nhật khuyến mãi ID: {}";
    public static final String LOG_PROMOTION_UPDATE_SUCCESS = "Cập nhật khuyến mãi thành công. Promotion ID: {}";

    // Log messages for get
    public static final String LOG_PROMOTION_GET_BY_ID = "Lấy khuyến mãi theo ID: {}";
    public static final String LOG_PROMOTION_GET_BY_CODE = "Lấy khuyến mãi theo mã: {}";
    public static final String LOG_PROMOTION_GET_ALL = "Lấy danh sách tất cả khuyến mãi, số lượng: {}";
    public static final String LOG_PROMOTION_GET_ALL_ACTIVE = "Lấy danh sách khuyến mãi đang hoạt động, số lượng: {}";

    // Log messages for delete
    public static final String LOG_PROMOTION_DELETE_START = "Bắt đầu xóa khuyến mãi ID: {}";
    public static final String LOG_PROMOTION_DELETE_SUCCESS = "Xóa khuyến mãi thành công. Promotion ID: {}";

    // Log messages for activate/deactivate
    public static final String LOG_PROMOTION_ACTIVATE_START = "Bắt đầu kích hoạt khuyến mãi ID: {}";
    public static final String LOG_PROMOTION_ACTIVATE_SUCCESS = "Kích hoạt khuyến mãi thành công. Promotion ID: {}";
    public static final String LOG_PROMOTION_DEACTIVATE_START = "Bắt đầu vô hiệu hóa khuyến mãi ID: {}";
    public static final String LOG_PROMOTION_DEACTIVATE_SUCCESS = "Vô hiệu hóa khuyến mãi thành công. Promotion ID: {}";

    // Log messages for validation
    public static final String LOG_PROMOTION_CODE_VALIDATION_FAILED = "Validation mã khuyến mãi thất bại: {}";
    public static final String LOG_PROMOTION_DATE_VALIDATION_FAILED = "Validation ngày tháng khuyến mãi thất bại: {}";
}
