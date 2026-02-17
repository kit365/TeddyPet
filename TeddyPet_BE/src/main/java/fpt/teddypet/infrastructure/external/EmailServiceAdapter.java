package fpt.teddypet.infrastructure.external;

import fpt.teddypet.application.constants.email.EmailLogMessages;
import fpt.teddypet.application.constants.email.EmailMessages;
import fpt.teddypet.application.port.output.EmailServicePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;

import jakarta.mail.internet.MimeMessage;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.entity.OrderItem;
import fpt.teddypet.domain.entity.Payment;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;
import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import java.time.LocalDate;

/**
 * Email service implementation using Spring Mail
 * Implements EmailServicePort to send emails via SMTP
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailServiceAdapter implements EmailServicePort {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private EmailServiceAdapter self; // vi goi truc tiep se ko quan ly dc spring proxy nen phai inject lai

    @Autowired
    public void setSelf(@Lazy EmailServiceAdapter self) {
        this.self = self;
    }

    @Value("${spring.mail.from:noreply@teddypet.id.vn}")
    private String fromEmail;

    @Value("${spring.mail.display-name:TeddyPet Support}")
    private String displayName;

    @Value("${app.name:TeddyPet}")
    private String appName;

    @Value("${app.hotline:1900 1234}")
    private String hotline;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(displayName + " <" + fromEmail + ">");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info(EmailLogMessages.LOG_EMAIL_SENT_SUCCESS, to);
        } catch (Exception e) {
            log.error(EmailLogMessages.LOG_EMAIL_SENT_FAILED, to, e);
        }
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, displayName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info(EmailLogMessages.LOG_HTML_EMAIL_SENT_SUCCESS, to);
        } catch (Exception e) {
            log.error(EmailLogMessages.LOG_HTML_EMAIL_SENT_FAILED, to, e);
        }
    }

    @Override
    public void sendBookingConfirmation(String to, Object bookingDetails) {
        String subject = String.format(EmailMessages.SUBJECT_BOOKING_CONFIRMATION, appName);
        String body = String.format("Đặt lịch của bạn đã được xác nhận. Chi tiết: %s", bookingDetails.toString());
        self.sendEmail(to, subject, body);
    }

    @Override
    public void sendOrderConfirmation(String to, Object orderDetails) {
        String subject = String.format(EmailMessages.SUBJECT_ORDER_CONFIRMATION, appName);
        String body = String.format("Đơn hàng của bạn đã được xác nhận. Chi tiết: %s", orderDetails.toString());
        self.sendEmail(to, subject, body);
    }

    @Override
    public void sendPasswordResetEmail(String to, String resetToken, String resetLink) {
        log.info(EmailLogMessages.LOG_SEND_PASSWORD_RESET, to);

        String subject = String.format(EmailMessages.SUBJECT_PASSWORD_RESET, appName);

        Context context = prepareContext();
        context.setVariable(EmailMessages.VAR_RESET_LINK, resetLink);

        String htmlBody = templateEngine.process("email/auth/forgot-password", context);

        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendVerificationEmail(String to, String token, String link) {
        log.info(EmailLogMessages.LOG_SEND_VERIFICATION, to);
        String subject = String.format(EmailMessages.SUBJECT_ACCOUNT_VERIFICATION, appName);

        Context context = prepareContext();
        context.setVariable(EmailMessages.VAR_VERIFY_LINK, link);

        String htmlBody = templateEngine.process("email/auth/verify-account", context);

        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendGuestOrderOtp(String to, String otp) {
        log.info(EmailLogMessages.LOG_SEND_GUEST_OTP, to);
        String subject = String.format(EmailMessages.SUBJECT_GUEST_OTP, appName);

        Context context = prepareContext();
        context.setVariable(EmailMessages.VAR_OTP, otp);

        String htmlBody = templateEngine.process("email/otp/guest-order", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendSecurityOtp(String to, String otp) {
        log.info(EmailLogMessages.LOG_SEND_SECURITY_OTP, to);
        String subject = String.format(EmailMessages.SUBJECT_SECURITY_OTP, appName);

        Context context = prepareContext();
        context.setVariable(EmailMessages.VAR_OTP, otp);

        String htmlBody = templateEngine.process("email/auth/security-otp", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendOrderConfirmation(Order order) {
        String logEmail = order.getGuestEmail() != null ? order.getGuestEmail()
                : (order.getUser() != null ? order.getUser().getEmail() : "N/A");

        String to = order.getGuestEmail() != null ? order.getGuestEmail()
                : (order.getUser() != null ? order.getUser().getEmail() : null);
        if (to == null) {
            log.warn(EmailLogMessages.LOG_NO_RECIPIENT, order.getId());
            return;
        }

        log.info(EmailLogMessages.LOG_SEND_ORDER_EMAIL, order.getOrderCode(), logEmail);

        Context context = prepareContext();
        context.setVariable(EmailMessages.VAR_WEB_URL, frontendUrl);
        context.setVariable(EmailMessages.VAR_ORDER_CODE, order.getOrderCode());
        context.setVariable(EmailMessages.VAR_ORDER_DATE,
                order.getCreatedAt() != null
                        ? order.getCreatedAt().atZone(ZoneId.systemDefault())
                                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        // Payment Status Text
        String paymentStatus = EmailMessages.LABEL_PAYMENT_PENDING;
        if (!order.getPayments().isEmpty()) {
            Payment p = order.getPayments().getFirst();
            if (p.getStatus() == PaymentStatusEnum.COMPLETED) {
                paymentStatus = EmailMessages.LABEL_PAYMENT_SUCCESS;
            } else if (p.getPaymentMethod() == PaymentMethodEnum.CASH) {
                paymentStatus = EmailMessages.LABEL_PAYMENT_COD;
            }
        }
        context.setVariable(EmailMessages.VAR_PAYMENT_STATUS, paymentStatus);

        context.setVariable(EmailMessages.VAR_FULL_NAME, order.getShippingName());
        context.setVariable(EmailMessages.VAR_ITEMS, order.getOrderItems());
        context.setVariable(EmailMessages.VAR_ITEM_COUNT,
                order.getOrderItems().stream().mapToInt(OrderItem::getQuantity).sum());
        context.setVariable(EmailMessages.VAR_SUBTOTAL, order.getSubtotal());
        context.setVariable(EmailMessages.VAR_SHIPPING_FEE, order.getShippingFee());
        context.setVariable(EmailMessages.VAR_SHIPPING_METHOD, EmailMessages.LABEL_SHIPPING_DEFAULT);
        context.setVariable(EmailMessages.VAR_DISCOUNT, order.getDiscountAmount());
        context.setVariable(EmailMessages.VAR_TOTAL, order.getFinalAmount());

        context.setVariable(EmailMessages.VAR_PHONE_NUMBER, order.getShippingPhone());
        context.setVariable(EmailMessages.VAR_ADDRESS, order.getShippingAddress());
        context.setVariable(EmailMessages.VAR_NOTES, order.getNotes());

        // Return details
        if (order.getStatus() == OrderStatusEnum.RETURN_REQUESTED || order.getReturnRequestedAt() != null) {
            context.setVariable("returnReason", order.getReturnReason());
            context.setVariable("adminReturnNote", order.getAdminReturnNote());
        }

        String method = EmailMessages.LABEL_METHOD_COD;
        if (!order.getPayments().isEmpty()) {
            Payment p = order.getPayments().getFirst();
            method = p.getPaymentMethod().name();
            if ("VNPAY".equals(method) || "E_WALLET".equals(method)) {
                method = EmailMessages.LABEL_METHOD_ONLINE;
            }
        }
        context.setVariable(EmailMessages.VAR_PAYMENT_METHOD, method);

        context.setVariable(EmailMessages.VAR_TRACK_ORDER_URL, frontendUrl + "/tracking?code=" + order.getOrderCode());

        String cName = order.getUser() != null
                ? (order.getUser().getFirstName() + " " + order.getUser().getLastName())
                : order.getShippingName();
        context.setVariable(EmailMessages.VAR_CUSTOMER_NAME, cName);

        context.setVariable(EmailMessages.VAR_CUSTOMER_EMAIL, order.getUser() != null ? order.getUser().getEmail()
                : (order.getGuestEmail() != null ? order.getGuestEmail() : EmailMessages.LABEL_NOT_AVAILABLE));
        context.setVariable(EmailMessages.VAR_SHIPPING_EMAIL, order.getGuestEmail() != null ? order.getGuestEmail()
                : (order.getUser() != null ? order.getUser().getEmail() : EmailMessages.LABEL_NOT_AVAILABLE));

        // Headline dynamic based on status
        String emailHeadline = EmailMessages.HEADLINE_ORDER_RECEIVED;
        String subHeadline = EmailMessages.SUB_HEADLINE_ORDER_RECEIVED;
        String subject = String.format(EmailMessages.SUBJECT_ORDER_RECEIVED, appName, order.getOrderCode());
        String statusText = EmailMessages.STATUS_TEXT_RECEIVED;

        if (order.getStatus() == OrderStatusEnum.CONFIRMED) {
            emailHeadline = EmailMessages.HEADLINE_ORDER_CONFIRMED;
            subHeadline = EmailMessages.SUB_HEADLINE_ORDER_CONFIRMED;
            subject = String.format(EmailMessages.SUBJECT_ORDER_CONFIRMED, appName, order.getOrderCode());
            statusText = EmailMessages.STATUS_TEXT_CONFIRMED;
        } else if (order.getStatus() == OrderStatusEnum.PROCESSING) {
            emailHeadline = EmailMessages.HEADLINE_ORDER_PREPARING;
            subHeadline = EmailMessages.SUB_HEADLINE_ORDER_PREPARING;
            subject = String.format(EmailMessages.SUBJECT_ORDER_PREPARING, appName, order.getOrderCode());
            statusText = EmailMessages.STATUS_TEXT_PREPARING;
        } else if (order.getStatus() == OrderStatusEnum.DELIVERING) {
            emailHeadline = EmailMessages.HEADLINE_ORDER_DELIVERING;
            subHeadline = EmailMessages.SUB_HEADLINE_ORDER_DELIVERING;
            subject = String.format(EmailMessages.SUBJECT_ORDER_DELIVERING, appName, order.getOrderCode());
            statusText = EmailMessages.STATUS_TEXT_DELIVERING;
        } else if (order.getStatus() == OrderStatusEnum.DELIVERED) {
            emailHeadline = EmailMessages.HEADLINE_ORDER_DELIVERED;
            subHeadline = EmailMessages.SUB_HEADLINE_ORDER_DELIVERED;
            subject = String.format(EmailMessages.SUBJECT_ORDER_DELIVERED, appName, order.getOrderCode());
            statusText = EmailMessages.STATUS_TEXT_DELIVERED;
        } else if (order.getStatus() == OrderStatusEnum.CANCELLED) {
            emailHeadline = EmailMessages.HEADLINE_ORDER_CANCELLED;
            subHeadline = EmailMessages.SUB_HEADLINE_ORDER_CANCELLED;
            subject = String.format(EmailMessages.SUBJECT_ORDER_CANCELLED, appName, order.getOrderCode());
            statusText = EmailMessages.STATUS_TEXT_CANCELLED;
        } else if (order.getStatus() == OrderStatusEnum.COMPLETED) {
            // Check if this is a Rejected Return
            if (order.getReturnRequestedAt() != null && order.getAdminReturnNote() != null
                    && !order.getAdminReturnNote().isBlank()) {
                emailHeadline = EmailMessages.HEADLINE_ORDER_RETURN_REJECTED;
                subHeadline = EmailMessages.SUB_HEADLINE_ORDER_RETURN_REJECTED;
                subject = String.format(EmailMessages.SUBJECT_ORDER_RETURN_REJECTED, appName, order.getOrderCode());
                statusText = EmailMessages.STATUS_TEXT_RETURN_REJECTED;
            } else {
                emailHeadline = EmailMessages.HEADLINE_ORDER_COMPLETED;
                subHeadline = EmailMessages.SUB_HEADLINE_ORDER_COMPLETED;
                subject = String.format(EmailMessages.SUBJECT_ORDER_STATUS_UPDATE, appName, order.getOrderCode());
                statusText = EmailMessages.STATUS_TEXT_COMPLETED;
            }
        } else if (order.getStatus() == OrderStatusEnum.RETURNED) {
            emailHeadline = EmailMessages.HEADLINE_ORDER_RETURNED;
            subHeadline = EmailMessages.SUB_HEADLINE_ORDER_RETURNED;
            subject = String.format(EmailMessages.SUBJECT_ORDER_RETURNED, appName, order.getOrderCode());
            statusText = EmailMessages.STATUS_TEXT_RETURNED;
        } else if (order.getStatus() == OrderStatusEnum.RETURN_REQUESTED) {
            emailHeadline = EmailMessages.HEADLINE_ORDER_RETURN_REQUESTED;
            subHeadline = EmailMessages.SUB_HEADLINE_ORDER_RETURN_REQUESTED;
            subject = String.format(EmailMessages.SUBJECT_ORDER_RETURN_REQUESTED, appName, order.getOrderCode());
            statusText = EmailMessages.STATUS_TEXT_RETURN_REQUESTED;
        }

        context.setVariable(EmailMessages.VAR_EMAIL_HEADLINE, emailHeadline);
        context.setVariable(EmailMessages.VAR_SUB_HEADLINE, subHeadline);
        context.setVariable(EmailMessages.VAR_ORDER_STATUS, order.getStatus().name());
        context.setVariable(EmailMessages.VAR_ORDER_STATUS_TEXT, statusText);

        String htmlBody = templateEngine.process("email/orders/confirmation", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    private Context prepareContext() {
        Context context = new Context();
        context.setVariable(EmailMessages.VAR_APP_NAME, appName);
        context.setVariable(EmailMessages.VAR_HOTLINE, hotline);
        context.setVariable(EmailMessages.VAR_FACEBOOK_URL, EmailMessages.VALUE_FACEBOOK_URL);
        context.setVariable(EmailMessages.VAR_INSTAGRAM_URL, EmailMessages.VALUE_INSTAGRAM_URL);
        return context;
    }
}
