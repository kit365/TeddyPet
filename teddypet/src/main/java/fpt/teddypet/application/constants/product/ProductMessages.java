package fpt.teddypet.application.constants.product;

public final class ProductMessages {

    private ProductMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_PRODUCT_CREATED_SUCCESS = "Tạo sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_UPDATED_SUCCESS = "Cập nhật sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_DELETED_SUCCESS = "Xóa sản phẩm thành công.";

    // Product not found messages
    public static final String MESSAGE_PRODUCT_NOT_FOUND_BY_ID = "Không tìm thấy sản phẩm với ID: %d";
    public static final String MESSAGE_PRODUCT_NOT_FOUND_BY_SLUG = "Không tìm thấy sản phẩm với slug: %s";
    public static final String MESSAGE_PRODUCT_NOT_ACTIVE = "Sản phẩm với ID: %d không đang hoạt động";
    public static final String MESSAGE_PRODUCT_ALREADY_DELETED = "Sản phẩm với ID: %d đã bị xóa";

    // Product validation messages
    public static final String MESSAGE_PRODUCT_NAME_REQUIRED = "Tên sản phẩm là bắt buộc";
    public static final String MESSAGE_PRODUCT_SLUG_ALREADY_EXISTS = "Slug đã tồn tại: %s";
    public static final String MESSAGE_PRODUCT_BARCODE_ALREADY_EXISTS = "Mã vạch đã tồn tại: %s";
    public static final String MESSAGE_PRODUCT_CATEGORY_NOT_FOUND = "Danh mục không tồn tại với ID: %s";
    public static final String MESSAGE_PRODUCT_BRAND_NOT_FOUND = "Thương hiệu không tồn tại với ID: %s";
    public static final String MESSAGE_PRODUCT_TAG_NOT_FOUND = "Tag không tồn tại với ID: %s";
    public static final String MESSAGE_PRODUCT_AGE_RANGE_NOT_FOUND = "Độ tuổi không tồn tại với ID: %s";
}

