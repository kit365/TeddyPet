package fpt.teddypet.application.constants.productbrand;

public final class ProductBrandMessages {

    private ProductBrandMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_PRODUCT_BRAND_CREATED_SUCCESS = "Tạo thương hiệu sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_BRAND_UPDATED_SUCCESS = "Cập nhật thương hiệu sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_BRAND_DELETED_SUCCESS = "Xóa thương hiệu sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_BRANDS_SYNC_SUCCESS = "Đồng bộ danh sách thương hiệu sản phẩm thành công.";

    // Error messages
    public static final String MESSAGE_PRODUCT_BRAND_NOT_FOUND = "Không tìm thấy thương hiệu sản phẩm.";
    public static final String MESSAGE_PRODUCT_BRAND_NOT_FOUND_BY_ID = "Không tìm thấy thương hiệu sản phẩm với ID: %s";
    public static final String MESSAGE_PRODUCT_BRAND_NAME_ALREADY_EXISTS = "Tên thương hiệu này đã được sử dụng.";
    public static final String MESSAGE_PRODUCT_BRANDS_LIST_EMPTY = "Danh sách thương hiệu sản phẩm không được rỗng.";
}

