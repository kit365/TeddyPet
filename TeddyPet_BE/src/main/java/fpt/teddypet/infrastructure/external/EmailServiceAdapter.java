package fpt.teddypet.infrastructure.external;

import fpt.teddypet.application.constants.common.GeneralConstants;
import fpt.teddypet.application.constants.email.EmailConstants;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.infrastructure.persistence.postgres.repository.settings.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import java.util.Map;
import java.util.List;

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

    private final TemplateEngine templateEngine;
    private final AppSettingRepository appSettingRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private EmailServiceAdapter self;

    @Autowired
    public void setSelf(@Lazy EmailServiceAdapter self) {
        this.self = self;
    }

    @Value("${brevo.from:kietops365@gmail.com}")
    private String fromEmail;

    @Value("${brevo.display-name:TeddyPet Support}")
    private String displayName;

    @Value("${brevo.api-key:}")
    private String apiKey;

    @Value("${brevo.api-url:https://api.brevo.com/v3/smtp/email}")
    private String apiUrl;

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
        sendBrevoRequest(to, subject, body, false);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        sendBrevoRequest(to, subject, htmlBody, true);
    }

    private void sendBrevoRequest(String to, String subject, String content, boolean isHtml) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("Brevo API Key is missing. Cannot send email to: {}", to);
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            Map<String, Object> payload = Map.of(
                "sender", Map.of("name", displayName, "email", fromEmail),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                isHtml ? "htmlContent" : "textContent", content
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(apiUrl, request, String.class);

            if (isHtml) {
                log.info("Successfully sent HTML email to {} via Brevo API", to);
            } else {
                log.info("Successfully sent TEXT email to {} via Brevo API", to);
            }
        } catch (Exception e) {
            log.error("Failed to send email to {} via Brevo API: {}", to, e.getMessage());
        }
    }

    @Override
    public void sendBookingConfirmation(String to, Object bookingDetails) {
        String subject = String.format(EmailConstants.SUBJECT_BOOKING_CONFIRMATION, appName);
        String body = String.format("Đặt lịch của bạn đã được xác nhận. Chi tiết: %s", bookingDetails.toString());
        self.sendEmail(to, subject, body);
    }

    @Override
    public void sendOrderConfirmation(String to, Object orderDetails) {
        String subject = String.format(EmailConstants.SUBJECT_ORDER_CONFIRMATION, appName);
        String body = String.format("Đơn hàng của bạn đã được xác nhận. Chi tiết: %s", orderDetails.toString());
        self.sendEmail(to, subject, body);
    }

    @Override
    public void sendPasswordResetEmail(String to, String resetToken, String resetLink) {
        log.info(EmailConstants.LOG_SEND_PASSWORD_RESET, to);

        String subject = String.format(EmailConstants.SUBJECT_PASSWORD_RESET, appName);

        Context context = prepareContext();
        context.setVariable(EmailConstants.VAR_RESET_LINK, resetLink);

        String htmlBody = templateEngine.process("email/auth/forgot-password", context);

        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendVerificationEmail(String to, String token, String link) {
        log.info(EmailConstants.LOG_SEND_VERIFICATION, to);
        String subject = String.format(EmailConstants.SUBJECT_ACCOUNT_VERIFICATION, appName);

        Context context = prepareContext();
        context.setVariable(EmailConstants.VAR_VERIFY_LINK, link);

        String htmlBody = templateEngine.process("email/auth/verify-account", context);

        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendGuestOrderOtp(String to, String otp) {
        log.info(EmailConstants.LOG_SEND_GUEST_OTP, to);
        String subject = String.format(EmailConstants.SUBJECT_GUEST_OTP, appName);

        Context context = prepareContext();
        context.setVariable(EmailConstants.VAR_OTP, otp);

        String htmlBody = templateEngine.process("email/otp/guest-order", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendSecurityOtp(String to, String otp) {
        log.info(EmailConstants.LOG_SEND_SECURITY_OTP, to);
        String subject = String.format(EmailConstants.SUBJECT_SECURITY_OTP, appName);

        Context context = prepareContext();
        context.setVariable(EmailConstants.VAR_OTP, otp);

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
            log.warn(EmailConstants.LOG_NO_RECIPIENT, order.getId());
            return;
        }

        log.info(EmailConstants.LOG_SEND_ORDER_EMAIL, order.getOrderCode(), logEmail);

        Context context = prepareContext();
        context.setVariable(EmailConstants.VAR_WEB_URL, frontendUrl);
        context.setVariable(EmailConstants.VAR_ORDER_CODE, order.getOrderCode());
        context.setVariable(EmailConstants.VAR_ORDER_DATE,
                order.getCreatedAt() != null
                        ? order.getCreatedAt().atZone(ZoneId.systemDefault())
                                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        // Payment Status Text
        String paymentStatus = EmailConstants.LABEL_PAYMENT_PENDING;
        if (!order.getPayments().isEmpty()) {
            Payment p = order.getPayments().getFirst();
            if (p.getStatus() == PaymentStatusEnum.COMPLETED) {
                paymentStatus = EmailConstants.LABEL_PAYMENT_SUCCESS;
            } else if (p.getPaymentMethod() == PaymentMethodEnum.CASH) {
                paymentStatus = EmailConstants.LABEL_PAYMENT_COD;
            }
        }
        context.setVariable(EmailConstants.VAR_PAYMENT_STATUS, paymentStatus);

        context.setVariable(EmailConstants.VAR_FULL_NAME, order.getShippingName());
        context.setVariable(EmailConstants.VAR_ITEMS, order.getOrderItems());
        context.setVariable(EmailConstants.VAR_ITEM_COUNT,
                order.getOrderItems().stream().mapToInt(OrderItem::getQuantity).sum());
        context.setVariable(EmailConstants.VAR_SUBTOTAL, order.getSubtotal());
        context.setVariable(EmailConstants.VAR_SHIPPING_FEE, order.getShippingFee());
        context.setVariable(EmailConstants.VAR_SHIPPING_METHOD, EmailConstants.LABEL_SHIPPING_DEFAULT);
        context.setVariable(EmailConstants.VAR_DISCOUNT, order.getDiscountAmount());
        context.setVariable(EmailConstants.VAR_TOTAL, order.getFinalAmount());

        context.setVariable(EmailConstants.VAR_PHONE_NUMBER, order.getShippingPhone());
        context.setVariable(EmailConstants.VAR_ADDRESS, order.getShippingAddress());
        context.setVariable(EmailConstants.VAR_NOTES, order.getNotes());

        // Payment Link for Bank Transfer
        if (order.getStatus() == OrderStatusEnum.CONFIRMED &&
                !order.getPayments().isEmpty() &&
                order.getPayments().get(0).getPaymentMethod() == PaymentMethodEnum.BANK_TRANSFER &&
                order.getPayments().get(0).getStatus() != PaymentStatusEnum.COMPLETED) {
            context.setVariable(EmailConstants.VAR_PAYMENT_URL, frontendUrl + "/dashboard/orders/" + order.getId());
        }

        // Return details
        if (order.getStatus() == OrderStatusEnum.RETURN_REQUESTED || order.getReturnRequestedAt() != null) {
            context.setVariable("returnReason", order.getReturnReason());
            context.setVariable("adminReturnNote", order.getAdminReturnNote());
        }

        String method = EmailConstants.LABEL_METHOD_COD;
        if (!order.getPayments().isEmpty()) {
            Payment p = order.getPayments().getFirst();
            method = p.getPaymentMethod().name();
            if ("VNPAY".equals(method) || "E_WALLET".equals(method)) {
                method = EmailConstants.LABEL_METHOD_ONLINE;
            }
        }
        context.setVariable(EmailConstants.VAR_PAYMENT_METHOD, method);

        context.setVariable(EmailConstants.VAR_TRACK_ORDER_URL, frontendUrl + "/tracking?code=" + order.getOrderCode());

        String cName = order.getUser() != null
                ? (order.getUser().getFirstName() + " " + order.getUser().getLastName())
                : order.getShippingName();
        context.setVariable(EmailConstants.VAR_CUSTOMER_NAME, cName);

        context.setVariable(EmailConstants.VAR_CUSTOMER_EMAIL, order.getUser() != null ? order.getUser().getEmail()
                : (order.getGuestEmail() != null ? order.getGuestEmail() : EmailConstants.LABEL_NOT_AVAILABLE));
        context.setVariable(EmailConstants.VAR_SHIPPING_EMAIL, order.getGuestEmail() != null ? order.getGuestEmail()
                : (order.getUser() != null ? order.getUser().getEmail() : EmailConstants.LABEL_NOT_AVAILABLE));

        // Headline dynamic based on status
        String emailHeadline = EmailConstants.HEADLINE_ORDER_RECEIVED;
        String subHeadline = EmailConstants.SUB_HEADLINE_ORDER_RECEIVED;
        String subject = String.format(EmailConstants.SUBJECT_ORDER_RECEIVED, appName, order.getOrderCode());
        String statusText = EmailConstants.STATUS_TEXT_RECEIVED;

        if (order.getStatus() == OrderStatusEnum.CONFIRMED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_CONFIRMED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_CONFIRMED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_CONFIRMED, appName, order.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_CONFIRMED;
        } else if (order.getStatus() == OrderStatusEnum.PROCESSING) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_PREPARING;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_PREPARING;
            subject = String.format(EmailConstants.SUBJECT_ORDER_PREPARING, appName, order.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_PREPARING;
        } else if (order.getStatus() == OrderStatusEnum.DELIVERING) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_DELIVERING;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_DELIVERING;
            subject = String.format(EmailConstants.SUBJECT_ORDER_DELIVERING, appName, order.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_DELIVERING;
        } else if (order.getStatus() == OrderStatusEnum.DELIVERED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_DELIVERED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_DELIVERED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_DELIVERED, appName, order.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_DELIVERED;
        } else if (order.getStatus() == OrderStatusEnum.CANCELLED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_CANCELLED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_CANCELLED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_CANCELLED, appName, order.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_CANCELLED;
        } else if (order.getStatus() == OrderStatusEnum.COMPLETED) {
            // Check if this is a Rejected Return
            if (order.getReturnRequestedAt() != null && order.getAdminReturnNote() != null
                    && !order.getAdminReturnNote().isBlank()) {
                emailHeadline = EmailConstants.HEADLINE_ORDER_RETURN_REJECTED;
                subHeadline = EmailConstants.SUB_HEADLINE_ORDER_RETURN_REJECTED;
                subject = String.format(EmailConstants.SUBJECT_ORDER_RETURN_REJECTED, appName, order.getOrderCode());
                statusText = EmailConstants.STATUS_TEXT_RETURN_REJECTED;
            } else {
                emailHeadline = EmailConstants.HEADLINE_ORDER_COMPLETED;
                subHeadline = EmailConstants.SUB_HEADLINE_ORDER_COMPLETED;
                subject = String.format(EmailConstants.SUBJECT_ORDER_STATUS_UPDATE, appName, order.getOrderCode());
                statusText = EmailConstants.STATUS_TEXT_COMPLETED;
            }
        } else if (order.getStatus() == OrderStatusEnum.RETURNED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_RETURNED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_RETURNED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_RETURNED, appName, order.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_RETURNED;
        } else if (order.getStatus() == OrderStatusEnum.RETURN_REQUESTED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_RETURN_REQUESTED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_RETURN_REQUESTED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_RETURN_REQUESTED, appName, order.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_RETURN_REQUESTED;
        }

        context.setVariable(EmailConstants.VAR_EMAIL_HEADLINE, emailHeadline);
        context.setVariable(EmailConstants.VAR_SUB_HEADLINE, subHeadline);
        context.setVariable(EmailConstants.VAR_ORDER_STATUS, order.getStatus().name());
        context.setVariable(EmailConstants.VAR_ORDER_STATUS_TEXT, statusText);

        String htmlBody = templateEngine.process("email/orders/confirmation", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    private Context prepareContext() {
        Context context = new Context();
        context.setVariable(EmailConstants.VAR_APP_NAME, appName);
        context.setVariable(EmailConstants.VAR_HOTLINE, hotline);

        String facebookUrl = appSettingRepository.findBySettingKey("SOCIAL_FACEBOOK")
                .map(fpt.teddypet.domain.entity.AppSetting::getSettingValue)
                .orElse(GeneralConstants.FACEBOOK_URL);

        String instagramUrl = appSettingRepository.findBySettingKey("SOCIAL_INSTAGRAM")
                .map(fpt.teddypet.domain.entity.AppSetting::getSettingValue)
                .orElse(GeneralConstants.INSTAGRAM_URL);

        context.setVariable(EmailConstants.VAR_FACEBOOK_URL, facebookUrl);
        context.setVariable(EmailConstants.VAR_INSTAGRAM_URL, instagramUrl);
        return context;
    }
}
