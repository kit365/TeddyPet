package fpt.teddypet.application.constants.producttag;

public final class ProductTagMessages {

    private ProductTagMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_PRODUCT_TAG_CREATED_SUCCESS = "Tạo tag sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_TAG_UPDATED_SUCCESS = "Cập nhật tag sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_TAG_DELETED_SUCCESS = "Xóa tag sản phẩm thành công.";

    // Error messages
    public static final String MESSAGE_PRODUCT_TAG_NOT_FOUND = "Không tìm thấy tag sản phẩm.";
    public static final String MESSAGE_PRODUCT_TAG_NOT_FOUND_BY_ID = "Không tìm thấy tag sản phẩm với ID: %s";
    public static final String MESSAGE_PRODUCT_TAG_NAME_ALREADY_EXISTS = "Tên tag này đã được sử dụng.";
}

