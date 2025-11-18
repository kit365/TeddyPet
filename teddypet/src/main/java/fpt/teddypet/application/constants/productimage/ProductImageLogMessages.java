package fpt.teddypet.application.constants.productimage;

public final class ProductImageLogMessages {

    private ProductImageLogMessages() {
        // Utility class - prevent instantiation
    }

    // Log messages for upsert
    public static final String LOG_PRODUCT_IMAGE_UPSERT_START = "Bắt đầu tạo/cập nhật hình ảnh sản phẩm với URL: {}";
    public static final String LOG_PRODUCT_IMAGE_UPSERT_SUCCESS = "Tạo/cập nhật hình ảnh sản phẩm thành công. Image ID: {}";
    public static final String LOG_PRODUCT_IMAGE_UPSERT_ERROR = "Lỗi khi tạo/cập nhật hình ảnh sản phẩm: {}";

    // Log messages for get
    public static final String LOG_PRODUCT_IMAGE_GET_BY_ID = "Lấy hình ảnh sản phẩm theo ID: {}";
    public static final String LOG_PRODUCT_IMAGE_GET_BY_PRODUCT_ID = "Lấy {} hình ảnh sản phẩm cho Product ID: {}";

    // Log messages for delete
    public static final String LOG_PRODUCT_IMAGE_DELETE_START = "Bắt đầu xóa hình ảnh sản phẩm ID: {}";
    public static final String LOG_PRODUCT_IMAGE_DELETE_SUCCESS = "Xóa hình ảnh sản phẩm thành công. Image ID: {}";
    public static final String LOG_PRODUCT_IMAGE_DELETE_ERROR = "Lỗi khi xóa hình ảnh sản phẩm: {}";

    // Log messages for save images
    public static final String LOG_PRODUCT_IMAGE_SAVE_IMAGES_START = "Bắt đầu đồng bộ hình ảnh sản phẩm cho Product ID: {}";
    public static final String LOG_PRODUCT_IMAGE_SAVE_IMAGES_DELETE = "Đã xóa mềm {} hình ảnh sản phẩm không còn trong danh sách mới.";
    public static final String LOG_PRODUCT_IMAGE_SAVE_IMAGES_SUCCESS = "Đồng bộ thành công {} hình ảnh sản phẩm cho Product ID: {}";
    public static final String LOG_PRODUCT_IMAGE_SAVE_IMAGES_ERROR = "Lỗi khi đồng bộ hình ảnh sản phẩm: {}";
}

