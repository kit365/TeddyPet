package fpt.teddypet.application.constants.product;

public final class ProductLogMessages {

    private ProductLogMessages() {
        // Utility class - prevent instantiation
    }

    // Find product log messages
    public static final String LOG_PRODUCT_FIND_BY_ID_START = "[ProductService] Bắt đầu tìm kiếm product theo ID: {}";
    public static final String LOG_PRODUCT_FIND_BY_ID_SUCCESS = "[ProductService] Tìm thấy product với ID: {}";
    public static final String LOG_PRODUCT_FIND_BY_ID_NOT_FOUND = "[ProductService] Không tìm thấy product với ID: {}";
    public static final String LOG_PRODUCT_FIND_BY_SLUG_START = "[ProductService] Bắt đầu tìm kiếm product theo slug: {}";
    public static final String LOG_PRODUCT_FIND_BY_SLUG_SUCCESS = "[ProductService] Tìm thấy product với slug: {}";
    public static final String LOG_PRODUCT_FIND_BY_SLUG_NOT_FOUND = "[ProductService] Không tìm thấy product với slug: {}";

    // Save product log messages
    public static final String LOG_PRODUCT_SAVE_START = "[ProductService] Bắt đầu lưu product: {}";
    public static final String LOG_PRODUCT_SAVE_SUCCESS = "[ProductService] Lưu product thành công, ID: {}";
    public static final String LOG_PRODUCT_SAVE_ERROR = "[ProductService] Lỗi khi lưu product: {}";

    // Update product log messages
    public static final String LOG_PRODUCT_UPDATE_START = "[ProductService] Bắt đầu cập nhật product, ID: {}";
    public static final String LOG_PRODUCT_UPDATE_SUCCESS = "[ProductService] Cập nhật product thành công, ID: {}";
    public static final String LOG_PRODUCT_UPDATE_ERROR = "[ProductService] Lỗi khi cập nhật product, ID: {}";

    // Delete product log messages
    public static final String LOG_PRODUCT_DELETE_START = "[ProductService] Bắt đầu xóa product, ID: {}";
    public static final String LOG_PRODUCT_DELETE_SUCCESS = "[ProductService] Xóa product thành công, ID: {}";
    public static final String LOG_PRODUCT_DELETE_ERROR = "[ProductService] Lỗi khi xóa product, ID: {}";
}

