package fpt.teddypet.application.constants.products.producttag;

public final class ProductTagMessages {

    private ProductTagMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_PRODUCT_TAG_CREATED_SUCCESS = "Tạo thẻ sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_TAG_UPDATED_SUCCESS = "Cập nhật thẻ sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_TAG_DELETED_SUCCESS = "Xóa thẻ sản phẩm thành công.";

    // Error messages
    public static final String MESSAGE_PRODUCT_TAG_NOT_FOUND = "Không tìm thấy thẻ sản phẩm.";
    public static final String MESSAGE_PRODUCT_TAG_NOT_FOUND_BY_ID = "Không tìm thấy thẻ sản phẩm với ID: %s";
    public static final String MESSAGE_PRODUCT_TAG_NAME_ALREADY_EXISTS = "Tên thẻ đã tồn tại.";
}
