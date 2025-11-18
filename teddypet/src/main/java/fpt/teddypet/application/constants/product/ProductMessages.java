package fpt.teddypet.application.constants.product;

public final class ProductMessages {

    private ProductMessages() {
        // Utility class - prevent instantiation
    }

    // Product not found messages
    public static final String MESSAGE_PRODUCT_NOT_FOUND_BY_ID = "Không tìm thấy sản phẩm với ID: %d";
    public static final String MESSAGE_PRODUCT_NOT_FOUND_BY_SLUG = "Không tìm thấy sản phẩm với slug: %s";
    public static final String MESSAGE_PRODUCT_NOT_ACTIVE = "Sản phẩm với ID: %d không đang hoạt động";
    public static final String MESSAGE_PRODUCT_ALREADY_DELETED = "Sản phẩm với ID: %d đã bị xóa";

    // Product validation messages
    public static final String MESSAGE_PRODUCT_NAME_REQUIRED = "Tên sản phẩm là bắt buộc";
    public static final String MESSAGE_PRODUCT_SLUG_ALREADY_EXISTS = "Slug đã tồn tại: %s";
    public static final String MESSAGE_PRODUCT_CATEGORY_NOT_FOUND = "Danh mục không tồn tại";
    public static final String MESSAGE_PRODUCT_BRAND_NOT_FOUND = "Thương hiệu không tồn tại";
}

