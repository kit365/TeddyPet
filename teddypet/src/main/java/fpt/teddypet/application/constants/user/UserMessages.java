package fpt.teddypet.application.constants.user;

public final class UserMessages {

    private UserMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_USER_CREATED_SUCCESS = "Tạo người dùng thành công.";
    public static final String MESSAGE_USER_UPDATED_SUCCESS = "Cập nhật người dùng thành công.";
    public static final String MESSAGE_USER_DELETED_SUCCESS = "Xóa người dùng thành công.";

    // Error messages
    public static final String MESSAGE_USER_NOT_FOUND = "Không tìm thấy người dùng.";
    public static final String MESSAGE_USER_NOT_FOUND_BY_EMAIL = "Không tìm thấy người dùng với email: %s";
    public static final String MESSAGE_USER_NOT_FOUND_BY_ID = "Không tìm thấy người dùng với ID: %s";
    public static final String MESSAGE_USER_ALREADY_EXISTS = "Người dùng đã tồn tại.";
    public static final String MESSAGE_USER_EMAIL_ALREADY_EXISTS = "Email này đã được sử dụng bởi người dùng khác.";
}

