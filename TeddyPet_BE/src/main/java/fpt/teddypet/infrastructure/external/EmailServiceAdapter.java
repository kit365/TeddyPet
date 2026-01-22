package fpt.teddypet.infrastructure.external;

import fpt.teddypet.application.port.output.EmailServicePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import jakarta.mail.internet.MimeMessage;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Email service implementation using Spring Mail
 * Implements EmailServicePort to send emails via SMTP
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailServiceAdapter implements EmailServicePort {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name:TeddyPet}")
    private String appName;

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("[EmailServiceAdapter] Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("[EmailServiceAdapter] Failed to send email to: {}", to, e);
        }
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("[EmailServiceAdapter] HTML email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("[EmailServiceAdapter] Failed to send HTML email to: {}", to, e);
        }
    }

    @Override
    public void sendBookingConfirmation(String to, Object bookingDetails) {
        String subject = appName + " - Xác nhận đặt lịch";
        String body = "Đặt lịch của bạn đã được xác nhận. Chi tiết: " + bookingDetails.toString();
        sendEmail(to, subject, body);
    }

    @Override
    public void sendOrderConfirmation(String to, Object orderDetails) {
        String subject = appName + " - Xác nhận đơn hàng";
        String body = "Đơn hàng của bạn đã được xác nhận. Chi tiết: " + orderDetails.toString();
        sendEmail(to, subject, body);
    }

    @Override
    public void sendPasswordResetEmail(String to, String resetToken, String resetLink) {
        log.info("[EmailServiceAdapter] Sending password reset email to: {}", to);
        
        String subject = appName + " - Đặt lại mật khẩu";
        
        String htmlBody = """
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
            """.formatted(appName, resetLink, resetLink, appName);
        
        sendHtmlEmail(to, subject, htmlBody);
        log.info("[EmailServiceAdapter] Password reset email sent successfully to: {}", to);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendVerificationEmail(String to, String token, String link) {
        log.info("[EmailServiceAdapter] Sending verification email to: {}", to);
        String subject = "Xác nhận tài khoản - " + appName;
        String htmlBody = """
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
            """.formatted(appName, appName, link, link, appName);
        sendHtmlEmail(to, subject, htmlBody);
    }
}
