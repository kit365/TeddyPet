package fpt.teddypet.application.constants.auth;

public final class AuthMessages {

    private AuthMessages() {
        // Utility class - prevent instantiation
    }

    // Success messages
    public static final String MESSAGE_REGISTER_SUCCESS = "Đăng ký thành công.";
    public static final String MESSAGE_LOGIN_SUCCESS = "Đăng nhập thành công.";

    // Error messages
    public static final String MESSAGE_PASSWORD_NOT_MATCH = "Mật khẩu không chính xác.";
    public static final String MESSAGE_EMAIL_DUPLICATE = "Email này đã được sử dụng.";
    public static final String MESSAGE_EMAIL_NOT_FOUND = "Email không tồn tại.";
    public static final String MESSAGE_INVALID_CREDENTIALS = "Email hoặc mật khẩu không chính xác.";
}

