package fpt.teddypet.application.constants.auth;

public final class AuthLogMessages {

    private AuthLogMessages() {
        // Utility class - prevent instantiation
    }

    // Register log messages
    public static final String LOG_AUTH_REGISTER_START = "[AuthService] Bắt đầu xử lý đăng ký cho email: {}";
    public static final String LOG_AUTH_REGISTER_SUCCESS = "[AuthService] Tạo user thành công, ID: {}";
    public static final String LOG_AUTH_REGISTER_WARN_EMAIL_EXISTS = "[AuthService] Email đã tồn tại: {}";
    public static final String LOG_AUTH_REGISTER_ERROR_DB = "[AuthService] Lỗi nghiêm trọng khi lưu user vào DB: {}";

    // Login log messages
    public static final String LOG_AUTH_LOGIN_START = "[AuthService] Bắt đầu xử lý đăng nhập cho email: {}";
    public static final String LOG_AUTH_LOGIN_SUCCESS = "[AuthService] Đăng nhập thành công cho email: {}";
    public static final String LOG_AUTH_LOGIN_ERROR_INVALID_CREDENTIALS = "[AuthService] Thông tin đăng nhập không hợp lệ cho email: {}";
    public static final String LOG_AUTH_LOGIN_ERROR_ACCOUNT_LOCKED = "[AuthService] Tài khoản bị khóa cho email: {}";
    public static final String LOG_AUTH_LOGIN_ERROR_ACCOUNT_DISABLED = "[AuthService] Tài khoản bị vô hiệu hóa cho email: {}";
}

