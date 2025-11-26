package fpt.teddypet.application.constants.products.rating;

public final class RatingLogMessages {

    private RatingLogMessages() {
        // Utility class - prevent instantiation
    }

    // Log messages for upsert
    public static final String LOG_RATING_UPSERT_START = "Bắt đầu tạo/cập nhật đánh giá cho sản phẩm ID: {}, người dùng ID: {}";
    public static final String LOG_RATING_UPSERT_SUCCESS = "Tạo/cập nhật đánh giá thành công. Rating ID: {}";
    public static final String LOG_RATING_UPSERT_ERROR = "Lỗi khi tạo/cập nhật đánh giá: {}";

    // Log messages for get
    public static final String LOG_RATING_GET_BY_ID = "Lấy đánh giá theo ID: {}";
    public static final String LOG_RATING_GET_ALL = "Lấy danh sách tất cả đánh giá, số lượng: {}";
    public static final String LOG_RATING_GET_BY_PRODUCT = "Lấy danh sách đánh giá theo sản phẩm ID: {}, số lượng: {}";
    public static final String LOG_RATING_GET_BY_USER = "Lấy danh sách đánh giá theo người dùng ID: {}, số lượng: {}";

    // Log messages for delete
    public static final String LOG_RATING_DELETE_START = "Bắt đầu xóa đánh giá ID: {}";
    public static final String LOG_RATING_DELETE_SUCCESS = "Xóa đánh giá thành công. Rating ID: {}";
    public static final String LOG_RATING_DELETE_ERROR = "Lỗi khi xóa đánh giá: {}";

    // Log messages for validation
    public static final String LOG_RATING_ALREADY_EXISTS = "Người dùng ID: {} đã đánh giá sản phẩm ID: {}";
}

