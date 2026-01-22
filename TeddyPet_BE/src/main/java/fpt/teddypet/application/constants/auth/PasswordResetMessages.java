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

    // Email template constants
    public static final String EMAIL_SUBJECT = "Yêu cầu đặt lại mật khẩu - TeddyPet";
    public static final String EMAIL_RESET_LINK_PLACEHOLDER = "{resetLink}";
    public static final String EMAIL_EXPIRATION_MINUTES_PLACEHOLDER = "{expirationMinutes}";

    public static final String EMAIL_HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Đặt lại mật khẩu</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4A90A4; margin: 0;">🐾 TeddyPet</h1>
                    </div>
                    
                    <h2 style="color: #333; margin-bottom: 20px;">Xin chào %s,</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 
                        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" 
                           style="display: inline-block; padding: 15px 40px; background-color: #4A90A4; color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                            Đặt lại mật khẩu
                        </a>
                    </div>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
                        Hoặc sao chép đường link bên dưới vào trình duyệt:
                    </p>
                    <p style="background-color: #f8f8f8; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #888;">
                        %s
                    </p>
                    
                    <div style="background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
                        <p style="margin: 0; color: #856404;">
                            ⚠️ <strong>Lưu ý:</strong> Link này sẽ hết hạn sau <strong>%d phút</strong>.
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Email này được gửi tự động từ TeddyPet. Vui lòng không trả lời email này.<br>
                        © 2024 TeddyPet. All rights reserved.
                    </p>
                </div>
            </body>
            </html>
            """;
}
