package fpt.teddypet.application.constants.products.productbrand;

public final class ProductBrandLogMessages {

    private ProductBrandLogMessages() {
        // Utility class - prevent instantiation
    }

    // Log messages for upsert
    public static final String LOG_PRODUCT_BRAND_UPSERT_START = "Bắt đầu tạo/cập nhật thương hiệu sản phẩm với tên: {}";
    public static final String LOG_PRODUCT_BRAND_UPSERT_SUCCESS = "Tạo/cập nhật thương hiệu sản phẩm thành công. Brand ID: {}";
    public static final String LOG_PRODUCT_BRAND_UPSERT_ERROR = "Lỗi khi tạo/cập nhật thương hiệu sản phẩm: {}";

    // Log messages for save brands
    public static final String LOG_PRODUCT_BRAND_SAVE_BRANDS_START = "Bắt đầu đồng bộ danh sách thương hiệu sản phẩm";
    public static final String LOG_PRODUCT_BRAND_SAVE_BRANDS_DELETE = "Xóa {} thương hiệu không có trong danh sách mới";
    public static final String LOG_PRODUCT_BRAND_SAVE_BRANDS_SUCCESS = "Đồng bộ thành công {} thương hiệu sản phẩm";
    public static final String LOG_PRODUCT_BRAND_SAVE_BRANDS_ERROR = "Lỗi khi đồng bộ thương hiệu sản phẩm: {}";

    // Log messages for get
    public static final String LOG_PRODUCT_BRAND_GET_BY_ID = "Lấy thương hiệu sản phẩm theo ID: {}";
    public static final String LOG_PRODUCT_BRAND_GET_ALL = "Lấy danh sách tất cả thương hiệu sản phẩm, số lượng: {}";

    // Log messages for delete
    public static final String LOG_PRODUCT_BRAND_DELETE_START = "Bắt đầu xóa thương hiệu sản phẩm ID: {}";
    public static final String LOG_PRODUCT_BRAND_DELETE_SUCCESS = "Xóa thương hiệu sản phẩm thành công. Brand ID: {}";
    public static final String LOG_PRODUCT_BRAND_DELETE_ERROR = "Lỗi khi xóa thương hiệu sản phẩm: {}";

    // Log messages for validation
    public static final String LOG_PRODUCT_BRAND_NAME_DUPLICATE = "Tên thương hiệu trùng lặp trong batch: {}";
    public static final String LOG_PRODUCT_BRAND_NAME_VALIDATION_FAILED = "Validation tên thương hiệu thất bại: {}";
}

