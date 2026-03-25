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

    // Other logs
    public static final String LOG_AUTH_TOKEN_EXTRACT_ERROR = "[AuthService] Không thể trích xuất email từ token khi đăng xuất";
    public static final String LOG_AUTH_BYPASS_VERIFICATION = "[AuthService] Bỏ qua xác thực email cho tài khoản test: {}";
    public static final String LOG_AUTH_VERIFY_EMAIL_START = "[AuthService] Đang xác thực email với token: {}";
    public static final String LOG_AUTH_EMAIL_ALREADY_VERIFIED = "[AuthService] Email đã được xác thực trước đó: {}";
    public static final String LOG_AUTH_EMAIL_VERIFIED_SUCCESS = "[AuthService] Xác thực email thành công cho: {}";
    public static final String LOG_AUTH_RESEND_EMAIL = "[AuthService] Gửi lại email xác thực cho: {}";
    public static final String LOG_AUTH_LOGOUT_START = "[AuthService] Đang đăng xuất người dùng";
    public static final String LOG_AUTH_LOGOUT_SUCCESS = "[AuthService] Đăng xuất người dùng thành công";
    public static final String LOG_AUTH_RESEND_VERIFICATION_EMAIL_SUCCESS = "[AuthService] Đã gửi lại email xác thực cho: {}";

    // OTP log messages
    public static final String LOG_OTP_SEND_GUEST_START = "[OtpService] Đang yêu cầu mã OTP cho email khách: {}";
    public static final String LOG_OTP_SEND_SUCCESS = "[OtpService] Đã gửi mã OTP thành công cho: {}";
    public static final String LOG_OTP_SEND_MEMBER_START = "[OtpService] Đang yêu cầu mã OTP bảo mật cho email thành viên: {}";
    public static final String LOG_OTP_SEND_MEMBER_SUCCESS = "[OtpService] Đã gửi mã OTP bảo mật thành công cho thành viên: {}";

    // Password change logs
    public static final String LOG_AUTH_CHANGE_PASSWORD_START = "[AuthService] Bắt đầu đổi mật khẩu cho người dùng: {}";
    public static final String LOG_AUTH_CHANGE_PASSWORD_SUCCESS = "[AuthService] Đổi mật khẩu thành công cho người dùng: {}";
    public static final String LOG_AUTH_CHANGE_EMAIL_START = "[AuthService] Bắt đầu đổi email từ {} sang {}";
}
