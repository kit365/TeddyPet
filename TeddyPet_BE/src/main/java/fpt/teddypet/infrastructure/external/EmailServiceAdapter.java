package fpt.teddypet.infrastructure.external;

import fpt.teddypet.application.constants.email.EmailTemplates;
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
        String subject = String.format(EmailTemplates.SUBJECT_BOOKING_CONFIRMATION, appName);
        String body = String.format(EmailTemplates.BODY_BOOKING_CONFIRMATION, bookingDetails.toString());
        sendEmail(to, subject, body);
    }

    @Override
    public void sendOrderConfirmation(String to, Object orderDetails) {
        String subject = String.format(EmailTemplates.SUBJECT_ORDER_CONFIRMATION, appName);
        String body = String.format(EmailTemplates.BODY_ORDER_CONFIRMATION, orderDetails.toString());
        sendEmail(to, subject, body);
    }

    @Override
    public void sendPasswordResetEmail(String to, String resetToken, String resetLink) {
        log.info("[EmailServiceAdapter] Sending password reset email to: {}", to);

        String subject = String.format(EmailTemplates.SUBJECT_PASSWORD_RESET, appName);
        String htmlBody = String.format(EmailTemplates.BODY_PASSWORD_RESET, appName, resetLink, resetLink, appName);

        sendHtmlEmail(to, subject, htmlBody);
        log.info("[EmailServiceAdapter] Password reset email sent successfully to: {}", to);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendVerificationEmail(String to, String token, String link) {
        log.info("[EmailServiceAdapter] Sending verification email to: {}", to);
        String subject = String.format(EmailTemplates.SUBJECT_ACCOUNT_VERIFICATION, appName);
        String htmlBody = String.format(EmailTemplates.BODY_ACCOUNT_VERIFICATION, appName, appName, link, link,
                appName);
        sendHtmlEmail(to, subject, htmlBody);
    }
}
