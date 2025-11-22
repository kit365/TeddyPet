package fpt.teddypet.application.constants.products.productimage;

public final class ProductImageMessages {

    private ProductImageMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_PRODUCT_IMAGE_CREATED_SUCCESS = "Tạo hình ảnh sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_IMAGE_UPDATED_SUCCESS = "Cập nhật hình ảnh sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_IMAGE_DELETED_SUCCESS = "Xóa hình ảnh sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_IMAGES_SAVE_SUCCESS = "Đồng bộ danh sách hình ảnh sản phẩm thành công.";

    // Error messages
    public static final String MESSAGE_PRODUCT_IMAGE_NOT_FOUND = "Không tìm thấy hình ảnh sản phẩm.";
    public static final String MESSAGE_PRODUCT_IMAGE_NOT_FOUND_BY_ID = "Không tìm thấy hình ảnh sản phẩm với ID: %s";
    public static final String MESSAGE_PRODUCT_NOT_FOUND_BY_ID = "Không tìm thấy sản phẩm với ID: %s";
}

