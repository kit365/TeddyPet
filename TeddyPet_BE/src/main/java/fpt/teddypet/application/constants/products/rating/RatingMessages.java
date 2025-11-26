package fpt.teddypet.application.constants.products.rating;

public final class RatingMessages {

    private RatingMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_RATING_CREATED_SUCCESS = "Tạo đánh giá thành công.";
    public static final String MESSAGE_RATING_UPDATED_SUCCESS = "Cập nhật đánh giá thành công.";
    public static final String MESSAGE_RATING_DELETED_SUCCESS = "Xóa đánh giá thành công.";

    // Error messages
    public static final String MESSAGE_RATING_NOT_FOUND = "Không tìm thấy đánh giá.";
    public static final String MESSAGE_RATING_NOT_FOUND_BY_ID = "Không tìm thấy đánh giá với ID: %s";
    public static final String MESSAGE_PRODUCT_NOT_FOUND = "Không tìm thấy sản phẩm với ID: %s";
    public static final String MESSAGE_USER_NOT_FOUND = "Không tìm thấy người dùng với ID: %s";
    public static final String MESSAGE_RATING_ALREADY_EXISTS = "Bạn đã đánh giá sản phẩm này rồi.";
    public static final String MESSAGE_RATING_NO_PERMISSION_UPDATE = "Bạn không có quyền cập nhật đánh giá này.";
    public static final String MESSAGE_RATING_NO_PERMISSION_DELETE = "Bạn không có quyền xóa đánh giá này.";
}

