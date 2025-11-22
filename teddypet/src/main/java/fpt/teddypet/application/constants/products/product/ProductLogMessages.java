package fpt.teddypet.application.constants.products.product;

public final class ProductLogMessages {

    private ProductLogMessages() {
        // Utility class - prevent instantiation
    }

    // Create/Update operations
    public static final String LOG_PRODUCT_UPSERT_START = "Bắt đầu tạo/cập nhật sản phẩm: {}";
    public static final String LOG_PRODUCT_UPSERT_SUCCESS = "Tạo/cập nhật sản phẩm thành công với ID: {}";
    public static final String LOG_PRODUCT_UPSERT_ERROR = "Lỗi khi tạo/cập nhật sản phẩm: {}";

    // Get operations
    public static final String LOG_PRODUCT_GET_BY_ID = "Lấy sản phẩm theo ID: {}";
    public static final String LOG_PRODUCT_GET_BY_SLUG = "Lấy sản phẩm theo slug: {}";
    public static final String LOG_PRODUCT_GET_ALL = "Lấy tất cả sản phẩm, tổng số: {}";

    // Delete operations
    public static final String LOG_PRODUCT_DELETE_START = "Bắt đầu xóa sản phẩm với ID: {}";
    public static final String LOG_PRODUCT_DELETE_SUCCESS = "Xóa sản phẩm thành công với ID: {}";
    public static final String LOG_PRODUCT_DELETE_ERROR = "Lỗi khi xóa sản phẩm với ID: {}";

    // Validation
    public static final String LOG_PRODUCT_SLUG_ALREADY_EXISTS = "Slug đã tồn tại: {}";
    public static final String LOG_PRODUCT_BARCODE_ALREADY_EXISTS = "Mã vạch đã tồn tại: {}";
    public static final String LOG_PRODUCT_BRAND_NOT_FOUND = "Không tìm thấy thương hiệu với ID: {}";
    public static final String LOG_PRODUCT_CATEGORY_NOT_FOUND = "Không tìm thấy danh mục với ID: {}";
    public static final String LOG_PRODUCT_TAG_NOT_FOUND = "Không tìm thấy tag với ID: {}";
    public static final String LOG_PRODUCT_AGE_RANGE_NOT_FOUND = "Không tìm thấy độ tuổi với ID: {}";
}
