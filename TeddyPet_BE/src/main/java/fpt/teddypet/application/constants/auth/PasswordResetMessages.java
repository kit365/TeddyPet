package fpt.teddypet.application.constants.auth;

/**
 * Constants for password reset messages
 */
public final class PasswordResetMessages {

    private PasswordResetMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_FORGOT_PASSWORD_SUCCESS = "Email đặt lại mật khẩu đã được gửi thành công. Vui lòng kiểm tra hộp thư của bạn.";
    public static final String MESSAGE_RESET_PASSWORD_SUCCESS = "Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.";
    public static final String MESSAGE_TOKEN_VALID = "Token hợp lệ.";

    // Error messages
    public static final String MESSAGE_TOKEN_INVALID = "Token không hợp lệ hoặc đã hết hạn.";
    public static final String MESSAGE_TOKEN_EXPIRED = "Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.";
    public static final String MESSAGE_PASSWORD_NOT_MATCH = "Mật khẩu xác nhận không khớp.";
    public static final String MESSAGE_EMAIL_NOT_FOUND = "Email không tồn tại trong hệ thống.";
    public static final String MESSAGE_USER_NOT_ACTIVE = "Tài khoản đã bị khóa hoặc vô hiệu hóa.";
    public static final String MESSAGE_EMAIL_NOT_VERIFIED = "Email của bạn chưa được xác thực. Vui lòng xác thực email trước khi thực hiện đặt lại mật khẩu.";

}
