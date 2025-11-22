package fpt.teddypet.application.constants.products.producttag;

public final class ProductTagLogMessages {

    private ProductTagLogMessages() {
        // Utility class - prevent instantiation
    }

    // Log messages for upsert
    public static final String LOG_PRODUCT_TAG_UPSERT_START = "Bắt đầu tạo/cập nhật tag sản phẩm với tên: {}";
    public static final String LOG_PRODUCT_TAG_UPSERT_SUCCESS = "Tạo/cập nhật tag sản phẩm thành công. Tag ID: {}";
    public static final String LOG_PRODUCT_TAG_UPSERT_ERROR = "Lỗi khi tạo/cập nhật tag sản phẩm: {}";

    // Log messages for get
    public static final String LOG_PRODUCT_TAG_GET_BY_ID = "Lấy tag sản phẩm theo ID: {}";
    public static final String LOG_PRODUCT_TAG_GET_ALL = "Lấy danh sách tất cả tag sản phẩm, số lượng: {}";

    // Log messages for delete
    public static final String LOG_PRODUCT_TAG_DELETE_START = "Bắt đầu xóa tag sản phẩm ID: {}";
    public static final String LOG_PRODUCT_TAG_DELETE_SUCCESS = "Xóa tag sản phẩm thành công. Tag ID: {}";
    public static final String LOG_PRODUCT_TAG_DELETE_ERROR = "Lỗi khi xóa tag sản phẩm: {}";

    // Log messages for validation
    public static final String LOG_PRODUCT_TAG_NAME_VALIDATION_FAILED = "Validation tên tag thất bại: {}";
}

