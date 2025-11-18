package fpt.teddypet.application.constants.productagerange;

public final class ProductAgeRangeMessages {

    private ProductAgeRangeMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_PRODUCT_AGE_RANGE_CREATED_SUCCESS = "Tạo độ tuổi sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_AGE_RANGE_UPDATED_SUCCESS = "Cập nhật độ tuổi sản phẩm thành công.";
    public static final String MESSAGE_PRODUCT_AGE_RANGE_DELETED_SUCCESS = "Xóa độ tuổi sản phẩm thành công.";

    // Error messages
    public static final String MESSAGE_PRODUCT_AGE_RANGE_NOT_FOUND = "Không tìm thấy độ tuổi sản phẩm.";
    public static final String MESSAGE_PRODUCT_AGE_RANGE_NOT_FOUND_BY_ID = "Không tìm thấy độ tuổi sản phẩm với ID: %s";
    public static final String MESSAGE_PRODUCT_AGE_RANGE_NAME_ALREADY_EXISTS = "Tên độ tuổi này đã được sử dụng.";
}

