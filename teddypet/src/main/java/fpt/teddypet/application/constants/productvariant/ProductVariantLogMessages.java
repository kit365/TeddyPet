package fpt.teddypet.application.constants.productvariant;

public final class ProductVariantLogMessages {

    private ProductVariantLogMessages() {
        // Utility class - prevent instantiation
    }

    // Log messages for upsert
    public static final String LOG_PRODUCT_VARIANT_UPSERT_START = "Bắt đầu tạo/cập nhật biến thể sản phẩm với SKU: {}";
    public static final String LOG_PRODUCT_VARIANT_UPSERT_SUCCESS = "Tạo/cập nhật biến thể sản phẩm thành công. Variant ID: {}";
    public static final String LOG_PRODUCT_VARIANT_UPSERT_ERROR = "Lỗi khi tạo/cập nhật biến thể sản phẩm: {}";

    // Log messages for batch upsert
    public static final String LOG_PRODUCT_VARIANT_BATCH_UPSERT_START = "Bắt đầu batch upsert {} biến thể sản phẩm";
    public static final String LOG_PRODUCT_VARIANT_BATCH_UPSERT_SUCCESS = "Batch upsert thành công {} biến thể sản phẩm";
    public static final String LOG_PRODUCT_VARIANT_BATCH_UPSERT_ERROR = "Lỗi khi batch upsert biến thể sản phẩm: {}";

    // Log messages for save variants
    public static final String LOG_PRODUCT_VARIANT_SAVE_VARIANTS_START = "Bắt đầu đồng bộ biến thể sản phẩm cho product ID: {}";
    public static final String LOG_PRODUCT_VARIANT_SAVE_VARIANTS_DELETE = "Xóa {} biến thể không có trong danh sách mới";
    public static final String LOG_PRODUCT_VARIANT_SAVE_VARIANTS_SUCCESS = "Đồng bộ thành công {} biến thể sản phẩm cho product ID: {}";
    public static final String LOG_PRODUCT_VARIANT_SAVE_VARIANTS_ERROR = "Lỗi khi đồng bộ biến thể sản phẩm: {}";

    // Log messages for get
    public static final String LOG_PRODUCT_VARIANT_GET_BY_ID = "Lấy biến thể sản phẩm theo ID: {}";
    public static final String LOG_PRODUCT_VARIANT_GET_BY_PRODUCT_ID = "Lấy danh sách biến thể cho product ID: {}, số lượng: {}";

    // Log messages for delete
    public static final String LOG_PRODUCT_VARIANT_DELETE_START = "Bắt đầu xóa biến thể sản phẩm ID: {}";
    public static final String LOG_PRODUCT_VARIANT_DELETE_SUCCESS = "Xóa biến thể sản phẩm thành công. Variant ID: {}";
    public static final String LOG_PRODUCT_VARIANT_DELETE_ERROR = "Lỗi khi xóa biến thể sản phẩm: {}";

    // Log messages for validation
    public static final String LOG_PRODUCT_VARIANT_SKU_DUPLICATE = "SKU trùng lặp trong batch: {}";
    public static final String LOG_PRODUCT_VARIANT_SKU_VALIDATION_FAILED = "Validation SKU thất bại: {}";
}
