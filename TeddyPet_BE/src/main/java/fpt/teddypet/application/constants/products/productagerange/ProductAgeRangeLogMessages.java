package fpt.teddypet.application.constants.products.productagerange;

public final class ProductAgeRangeLogMessages {

    private ProductAgeRangeLogMessages() {
        // Utility class - prevent instantiation
    }

    // Log messages for upsert
    public static final String LOG_PRODUCT_AGE_RANGE_UPSERT_START = "Bắt đầu tạo/cập nhật độ tuổi sản phẩm với tên: {}";
    public static final String LOG_PRODUCT_AGE_RANGE_UPSERT_SUCCESS = "Tạo/cập nhật độ tuổi sản phẩm thành công. AgeRange ID: {}";
    public static final String LOG_PRODUCT_AGE_RANGE_UPSERT_ERROR = "Lỗi khi tạo/cập nhật độ tuổi sản phẩm: {}";

    // Log messages for get
    public static final String LOG_PRODUCT_AGE_RANGE_GET_BY_ID = "Lấy độ tuổi sản phẩm theo ID: {}";
    public static final String LOG_PRODUCT_AGE_RANGE_GET_ALL = "Lấy danh sách tất cả độ tuổi sản phẩm, số lượng: {}";

    // Log messages for delete
    public static final String LOG_PRODUCT_AGE_RANGE_DELETE_START = "Bắt đầu xóa độ tuổi sản phẩm ID: {}";
    public static final String LOG_PRODUCT_AGE_RANGE_DELETE_SUCCESS = "Xóa độ tuổi sản phẩm thành công. AgeRange ID: {}";
    public static final String LOG_PRODUCT_AGE_RANGE_DELETE_ERROR = "Lỗi khi xóa độ tuổi sản phẩm: {}";

    // Log messages for validation
    public static final String LOG_PRODUCT_AGE_RANGE_NAME_VALIDATION_FAILED = "Validation tên độ tuổi thất bại: {}";
}

