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
    public static final String MESSAGE_EMAIL_DUPLICATE = "Email đã được sử dụng.";
    public static final String MESSAGE_EMAIL_NOT_FOUND = "Email không tồn tại.";
    public static final String MESSAGE_INVALID_CREDENTIALS = "Email hoặc mật khẩu không chính xác.";
    public static final String MESSAGE_USER_NOT_AUTHENTICATED = "Người dùng chưa được xác thực.";
    public static final String MESSAGE_CANNOT_DETERMINE_USER = "Không thể xác định người dùng hiện tại.";
    public static final String MESSAGE_USER_NOT_FOUND = "Không tìm thấy người dùng.";
    
    // Email Verification messages
    public static final String MESSAGE_VERIFY_EMAIL_SENT = "Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn.";
    public static final String MESSAGE_VERIFY_EMAIL_SUCCESS = "Xác thực email thành công. Chào mừng bạn đến với TeddyPet!";
    public static final String MESSAGE_EMAIL_ALREADY_VERIFIED = "Email này đã được xác thực trước đó.";
    public static final String MESSAGE_INVALID_VERIFY_TOKEN = "Mã xác thực không hợp lệ hoặc đã hết hạn.";
    public static final String MESSAGE_EMAIL_NOT_VERIFIED = "Tài khoản của bạn chưa được xác thực email. Vui lòng xác thực trước khi đăng nhập.";
}
