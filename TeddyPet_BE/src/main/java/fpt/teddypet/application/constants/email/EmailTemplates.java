package fpt.teddypet.application.constants.email;

public final class EmailTemplates {

    private EmailTemplates() {
    }

    // Subjects
    public static final String SUBJECT_PASSWORD_RESET = "%s - Đặt lại mật khẩu";
    public static final String SUBJECT_ACCOUNT_VERIFICATION = "Xác nhận tài khoản - %s";
    public static final String SUBJECT_GUEST_OTP = "[%s] Mã xác thực đơn hàng của bạn";
    public static final String SUBJECT_BOOKING_CONFIRMATION = "%s - Xác nhận đặt lịch";
    public static final String SUBJECT_ORDER_CONFIRMATION = "%s - Xác nhận đơn hàng";
    public static final String SUBJECT_ORDER_STATUS_UPDATE = "%s - Cập nhật trạng thái đơn hàng #%s";

    // Body Templates

    // 1. Password Reset
    // Args: AppName, ResetLink, ResetLink, AppName
    public static final String BODY_PASSWORD_RESET = """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Đặt lại mật khẩu</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #FF6B6B; margin: 0; font-size: 28px;">🐾 %s</h1>
                        <p style="color: #666; margin-top: 10px;">Yêu cầu đặt lại mật khẩu</p>
                    </div>

                    <!-- Content -->
                    <div style="color: #333; line-height: 1.6;">
                        <p>Xin chào,</p>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tiếp tục:</p>

                        <!-- Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #FF6B6B 0%%, #FF8E53 100%%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);">
                                Đặt lại mật khẩu
                            </a>
                        </div>

                        <!-- Alternative Link -->
                        <p style="font-size: 14px; color: #666;">Hoặc sao chép đường link sau vào trình duyệt:</p>
                        <p style="font-size: 12px; word-break: break-all; background: #f9f9f9; padding: 10px; border-radius: 5px; color: #0066cc;">%s</p>

                        <!-- Warning -->
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">
                                ⚠️ <strong>Lưu ý:</strong> Link này sẽ hết hạn sau 15 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                        <p>© 2026 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """;

    // 2. Account Verification
    // Args: AppName, AppName, VerifyLink, VerifyLink, AppName
    public static final String BODY_ACCOUNT_VERIFICATION = """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4A90A4; margin: 0; font-size: 28px;">🐾 %s</h1>
                        <p style="color: #666; margin-top: 10px;">Chào mừng bạn đến với mái nhà của các bé thú cưng!</p>
                    </div>
                    <div style="color: #333; line-height: 1.6;">
                        <p>Xin chào,</p>
                        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>%s</strong>. Chỉ còn một bước cuối cùng nữa thôi, hãy nhấn vào nút bên dưới để xác thực tài khoản của bạn:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" style="background-color: #4A90A4; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                                Xác thực tài khoản
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #666;">Nếu nút trên không hoạt động, bạn có thể copy link sau vào trình duyệt:</p>
                        <p style="font-size: 12px; word-break: break-all; background: #f9f9f9; padding: 10px; border-radius: 5px; color: #0066cc;">%s</p>
                    </div>
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                        <p>© 2026 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """;

    // 3. Guest OTP
    // Args: AppName, OtpCode, AppName
    public static final String BODY_GUEST_OTP = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
                <h2 style="color: #333; text-align: center;">🐾 %s - Mã Xác Thực (OTP)</h2>
                <p>Xin chào,</p>
                <p>Bạn đang thực hiện đặt hàng với tư cách khách vãng lai.</p>
                <p>Mã xác thực của bạn là:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50; background: #f9f9f9; padding: 15px 30px; border-radius: 10px; border: 1px dashed #4CAF50;">
                        %s
                    </span>
                </div>
                <p>Mã này sẽ hết hạn sau <strong>5 phút</strong>.</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
                    © 2026 %s. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
                </p>
            </div>
            """;

    // 4. Booking Confirmation
    public static final String BODY_BOOKING_CONFIRMATION = "Đặt lịch của bạn đã được xác nhận. Chi tiết: %s";

    // 5. Order Confirmation
    public static final String BODY_ORDER_CONFIRMATION = "Đơn hàng của bạn đã được xác nhận. Chi tiết: %s";

    // 6. Order Status Update
    // Args: AppName, OrderCode, ReceiverName, OrderCode, Status, Message,
    // OrderLink, AppName, AppName
    public static final String BODY_ORDER_STATUS_UPDATE = """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 16px; margin-top: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden;">
                    <!-- Header -->
                    <div style="background-color: #00AB55; padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🐾 %s</h1>
                        <p style="color: rgba(255,255,255,0.8); margin-top: 5px; font-size: 14px;">Cập nhật đơn hàng #%s</p>
                    </div>

                    <!-- Content -->
                    <div style="padding: 40px 30px; color: #333; line-height: 1.6;">
                        <p style="font-size: 16px;">Xin chào <strong>%s</strong>,</p>

                        <p>Đơn hàng <strong>#%s</strong> của bạn vừa được cập nhật trạng thái:</p>

                        <div style="background-color: #F0FDF4; border: 1px dashed #00AB55; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center;">
                            <span style="display: block; font-size: 14px; color: #637381; text-transform: uppercase; font-weight: 700; margin-bottom: 5px;">TRẠNG THÁI MỚI</span>
                            <span style="display: block; font-size: 24px; color: #00AB55; font-weight: 900;">%s</span>
                            <p style="margin: 10px 0 0; color: #212B36; font-size: 15px;">%s</p>
                        </div>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="%s" style="background-color: #212B36; color: white; padding: 15px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px;">
                                Xem chi tiết đơn hàng
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #F4F6F8; color: #637381; font-size: 12px;">
                        <p style="margin: 0;">© 2026 %s. Cảm ơn bạn đã tin tưởng và mua sắm!</p>
                        <p style="margin: 5px 0 0;">%s</p>
                    </div>
                </div>
            </body>
            </html>
            """;
}
