package fpt.teddypet.application.constants.auth;

/**
 * Log messages for password reset operations
 */
public final class PasswordResetLogMessages {

    private PasswordResetLogMessages() {
        // Utility class - prevent instantiation
    }

    // Forgot password log messages
    public static final String LOG_FORGOT_PASSWORD_START = "[PasswordResetService] Bắt đầu xử lý quên mật khẩu cho email: {}";
    public static final String LOG_FORGOT_PASSWORD_USER_NOT_FOUND = "[PasswordResetService] Không tìm thấy user với email: {} (không báo lỗi cho client vì lý do bảo mật)";
    public static final String LOG_FORGOT_PASSWORD_USER_NOT_ACTIVE = "[PasswordResetService] User không active: {}";
    public static final String LOG_FORGOT_PASSWORD_TOKEN_GENERATED = "[PasswordResetService] Token đã được tạo cho email: {}";
    public static final String LOG_FORGOT_PASSWORD_EMAIL_SENT = "[PasswordResetService] Email đặt lại mật khẩu đã được gửi đến: {}";
    public static final String LOG_FORGOT_PASSWORD_EMAIL_FAILED = "[PasswordResetService] Lỗi khi gửi email đến: {}";

    // Reset password log messages
    public static final String LOG_RESET_PASSWORD_START = "[PasswordResetService] Bắt đầu xử lý đặt lại mật khẩu với token";
    public static final String LOG_RESET_PASSWORD_TOKEN_INVALID = "[PasswordResetService] Token không hợp lệ hoặc đã hết hạn";
    public static final String LOG_RESET_PASSWORD_SUCCESS = "[PasswordResetService] Đặt lại mật khẩu thành công cho email: {}";
    public static final String LOG_RESET_PASSWORD_ERROR = "[PasswordResetService] Lỗi khi đặt lại mật khẩu: {}";

    // Token validation log messages
    public static final String LOG_VALIDATE_TOKEN_START = "[PasswordResetService] Bắt đầu validate token";
    public static final String LOG_VALIDATE_TOKEN_RESULT = "[PasswordResetService] Kết quả validate token: {}";
}
