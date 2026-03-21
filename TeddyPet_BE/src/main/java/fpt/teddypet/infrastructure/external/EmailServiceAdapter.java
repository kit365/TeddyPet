package fpt.teddypet.infrastructure.external;

import fpt.teddypet.application.constants.common.GeneralConstants;
import fpt.teddypet.application.constants.email.EmailConstants;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.infrastructure.persistence.postgres.repository.settings.AppSettingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
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
public class EmailServiceAdapter implements EmailServicePort {

    private final TemplateEngine templateEngine;
    private final AppSettingRepository appSettingRepository;
    private final fpt.teddypet.infrastructure.persistence.postgres.repository.orders.OrderRepository orderRepository;
    private final RestTemplate restTemplate;
    private EmailServiceAdapter self;

    public EmailServiceAdapter(TemplateEngine templateEngine, AppSettingRepository appSettingRepository, fpt.teddypet.infrastructure.persistence.postgres.repository.orders.OrderRepository orderRepository) {
        this.templateEngine = templateEngine;
        this.appSettingRepository = appSettingRepository;
        this.orderRepository = orderRepository;
        
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // 10s
        factory.setReadTimeout(10000);    // 10s
        this.restTemplate = new RestTemplate(factory);
    }

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

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendBookingPendingDepositEmail(String to, String bookingCode) {
        log.info("Sending booking pending deposit email to {}", to);
        String subject = String.format("[%s] Yêu cầu thanh toán cọc đơn đặt lịch #%s", appName, bookingCode);

        Context context = prepareContext();
        context.setVariable("bookingCode", bookingCode);
        context.setVariable("paymentUrl", frontendUrl + "/dat-lich/chi-tiet-don/" + bookingCode);

        String htmlBody = templateEngine.process("email/bookings/pending-deposit", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendBookingDepositReminderEmail(String to, String bookingCode) {
        log.info("Sending booking deposit reminder email to {}", to);
        String subject = String.format("[%s] NHẮC NHỞ: Vui lòng thanh toán cọc đơn đặt lịch #%s", appName, bookingCode);

        Context context = prepareContext();
        context.setVariable("bookingCode", bookingCode);
        context.setVariable("paymentUrl", frontendUrl + "/dat-lich/chi-tiet-don/" + bookingCode);

        String htmlBody = templateEngine.process("email/bookings/deposit-reminder", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendBookingDepositSuccessEmail(String to, String bookingCode) {
        log.info("Sending booking deposit success email to {}", to);
        String subject = String.format("[%s] Thanh toán cọc thành công đơn đặt lịch #%s", appName, bookingCode);

        Context context = prepareContext();
        context.setVariable("bookingCode", bookingCode);
        context.setVariable("detailUrl", frontendUrl + "/dat-lich/chi-tiet-don/" + bookingCode);

        String htmlBody = templateEngine.process("email/bookings/deposit-success", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendBookingCancelledEmail(String to, String bookingCode) {
        log.info("Sending booking cancelled email to {}", to);
        String subject = String.format("[%s] Đơn đặt lịch #%s đã bị hủy", appName, bookingCode);

        Context context = prepareContext();
        context.setVariable("bookingCode", bookingCode);
        context.setVariable("detailUrl", frontendUrl + "/dat-lich/chi-tiet-don/" + bookingCode);

        String htmlBody = templateEngine.process("email/bookings/booking-cancelled", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendBookingRefundRequestedEmail(String to, String bookingCode, String refundAmount) {
        log.info("Sending booking refund-requested email to {}", to);
        String subject = String.format("[%s] Yêu cầu hoàn cọc đơn đặt lịch #%s đã được ghi nhận", appName, bookingCode);

        Context context = prepareContext();
        context.setVariable("bookingCode", bookingCode);
        context.setVariable("refundAmount", refundAmount);
        context.setVariable("detailUrl", frontendUrl + "/dat-lich/chi-tiet-don/" + bookingCode);

        String htmlBody = templateEngine.process("email/bookings/refund-requested", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendBookingDepositExpiredEmail(String to, String bookingCode) {
        log.info("Sending booking deposit expired email to {}", to);
        String subject = String.format("[%s] Đơn đặt lịch #%s đã hết thời gian giữ chỗ", appName, bookingCode);

        Context context = prepareContext();
        context.setVariable("bookingCode", bookingCode);
        context.setVariable("rebookUrl", frontendUrl + "/dat-lich");

        String htmlBody = templateEngine.process("email/bookings/deposit-expired", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendBookingRefundApprovedEmail(String to, String bookingCode, String refundAmount, String adminResponse) {
        log.info("Sending booking refund approved email to {}", to);
        String subject = String.format("[%s] Yêu cầu hoàn cọc đơn đặt lịch #%s đã được phê duyệt", appName, bookingCode);

        Context context = prepareContext();
        context.setVariable("bookingCode", bookingCode);
        context.setVariable("refundAmount", refundAmount);
        context.setVariable("adminResponse", adminResponse);
        context.setVariable("detailUrl", frontendUrl + "/dat-lich/chi-tiet-don/" + bookingCode);

        String htmlBody = templateEngine.process("email/bookings/refund-approved", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendBookingRefundRejectedEmail(String to, String bookingCode, String adminResponse) {
        log.info("Sending booking refund rejected email to {}", to);
        String subject = String.format("[%s] Yêu cầu hoàn cọc đơn đặt lịch #%s đã bị từ chối", appName, bookingCode);

        Context context = prepareContext();
        context.setVariable("bookingCode", bookingCode);
        context.setVariable("adminResponse", adminResponse);
        context.setVariable("detailUrl", frontendUrl + "/dat-lich/chi-tiet-don/" + bookingCode);

        String htmlBody = templateEngine.process("email/bookings/refund-rejected", context);
        self.sendHtmlEmail(to, subject, htmlBody);
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
    public void sendAdminInvitationEmail(String to, String link) {
        log.info("Sending admin invitation email to {}", to);
        String subject = String.format("[%s] Lời mời tham gia quản trị hệ thống", appName);

        Context context = prepareContext();
        context.setVariable("invitationLink", link);

        String htmlBody = templateEngine.process("email/auth/admin-invitation", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendOrderConfirmation(Order order) {
        // Reload order with items and payments to avoid LazyInitializationException in @Async context
        Order detailedOrder = orderRepository.findByIdWithDetails(order.getId()).orElse(order);

        String logEmail = detailedOrder.getGuestEmail() != null ? detailedOrder.getGuestEmail()
                : (detailedOrder.getUser() != null ? detailedOrder.getUser().getEmail() : "N/A");

        String to = detailedOrder.getGuestEmail() != null ? detailedOrder.getGuestEmail()
                : (detailedOrder.getUser() != null ? detailedOrder.getUser().getEmail() : null);
        if (to == null) {
            log.warn(EmailConstants.LOG_NO_RECIPIENT, detailedOrder.getId());
            return;
        }

        log.info(EmailConstants.LOG_SEND_ORDER_EMAIL, detailedOrder.getOrderCode(), logEmail);

        Context context = prepareContext();
        context.setVariable(EmailConstants.VAR_WEB_URL, frontendUrl);
        context.setVariable(EmailConstants.VAR_ORDER_CODE, detailedOrder.getOrderCode());
        context.setVariable(EmailConstants.VAR_ORDER_DATE,
                detailedOrder.getCreatedAt() != null
                        ? detailedOrder.getCreatedAt().atZone(ZoneId.systemDefault())
                                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        // Payment Status Text
        String paymentStatus = EmailConstants.LABEL_PAYMENT_PENDING;
        if (!detailedOrder.getPayments().isEmpty()) {
            Payment p = detailedOrder.getPayments().iterator().next();
            if (p.getStatus() == PaymentStatusEnum.COMPLETED) {
                paymentStatus = EmailConstants.LABEL_PAYMENT_SUCCESS;
            } else if (p.getPaymentMethod() == PaymentMethodEnum.CASH) {
                paymentStatus = EmailConstants.LABEL_PAYMENT_COD;
            }
        }
        context.setVariable(EmailConstants.VAR_PAYMENT_STATUS, paymentStatus);

        context.setVariable(EmailConstants.VAR_FULL_NAME, detailedOrder.getShippingName());
        context.setVariable(EmailConstants.VAR_ITEMS, detailedOrder.getOrderItems());
        context.setVariable(EmailConstants.VAR_ITEM_COUNT,
                detailedOrder.getOrderItems().stream().mapToInt(OrderItem::getQuantity).sum());
        context.setVariable(EmailConstants.VAR_SUBTOTAL, detailedOrder.getSubtotal());
        context.setVariable(EmailConstants.VAR_SHIPPING_FEE, detailedOrder.getShippingFee());
        context.setVariable(EmailConstants.VAR_SHIPPING_METHOD, EmailConstants.LABEL_SHIPPING_DEFAULT);
        context.setVariable(EmailConstants.VAR_DISCOUNT, detailedOrder.getDiscountAmount());
        context.setVariable(EmailConstants.VAR_TOTAL, detailedOrder.getFinalAmount());

        context.setVariable(EmailConstants.VAR_PHONE_NUMBER, detailedOrder.getShippingPhone());
        context.setVariable(EmailConstants.VAR_ADDRESS, detailedOrder.getShippingAddress());
        context.setVariable(EmailConstants.VAR_NOTES, detailedOrder.getNotes());

        // Payment Link for Bank Transfer
        if (detailedOrder.getStatus() == OrderStatusEnum.CONFIRMED &&
                !detailedOrder.getPayments().isEmpty() &&
                detailedOrder.getPayments().iterator().next().getPaymentMethod() == PaymentMethodEnum.BANK_TRANSFER &&
                detailedOrder.getPayments().iterator().next().getStatus() != PaymentStatusEnum.COMPLETED) {
            context.setVariable(EmailConstants.VAR_PAYMENT_URL, frontendUrl + "/dashboard/orders/" + detailedOrder.getId());
        }

        // Return details
        if (detailedOrder.getStatus() == OrderStatusEnum.RETURN_REQUESTED || detailedOrder.getReturnRequestedAt() != null) {
            context.setVariable("returnReason", detailedOrder.getReturnReason());
            context.setVariable("adminReturnNote", detailedOrder.getAdminReturnNote());
        }

        String method = EmailConstants.LABEL_METHOD_COD;
        if (!detailedOrder.getPayments().isEmpty()) {
            Payment p = detailedOrder.getPayments().iterator().next();
            if (p.getPaymentMethod() == PaymentMethodEnum.BANK_TRANSFER) {
                method = EmailConstants.LABEL_METHOD_ONLINE;
            }
        }
        context.setVariable(EmailConstants.VAR_PAYMENT_METHOD, method);

        context.setVariable(EmailConstants.VAR_TRACK_ORDER_URL, frontendUrl + "/tracking?code=" + detailedOrder.getOrderCode());

        String cName = detailedOrder.getUser() != null
                ? (detailedOrder.getUser().getFirstName() + " " + detailedOrder.getUser().getLastName())
                : detailedOrder.getShippingName();
        context.setVariable(EmailConstants.VAR_CUSTOMER_NAME, cName);

        context.setVariable(EmailConstants.VAR_CUSTOMER_EMAIL, detailedOrder.getUser() != null ? detailedOrder.getUser().getEmail()
                : (detailedOrder.getGuestEmail() != null ? detailedOrder.getGuestEmail() : EmailConstants.LABEL_NOT_AVAILABLE));
        context.setVariable(EmailConstants.VAR_SHIPPING_EMAIL, detailedOrder.getGuestEmail() != null ? detailedOrder.getGuestEmail()
                : (detailedOrder.getUser() != null ? detailedOrder.getUser().getEmail() : EmailConstants.LABEL_NOT_AVAILABLE));

        // Headline dynamic based on status
        String emailHeadline = EmailConstants.HEADLINE_ORDER_RECEIVED;
        String subHeadline = EmailConstants.SUB_HEADLINE_ORDER_RECEIVED;
        String subject = String.format(EmailConstants.SUBJECT_ORDER_RECEIVED, appName, detailedOrder.getOrderCode());
        String statusText = EmailConstants.STATUS_TEXT_RECEIVED;

        if (detailedOrder.getStatus() == OrderStatusEnum.CONFIRMED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_CONFIRMED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_CONFIRMED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_CONFIRMED, appName, detailedOrder.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_CONFIRMED;
        } else if (detailedOrder.getStatus() == OrderStatusEnum.PROCESSING) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_PREPARING;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_PREPARING;
            subject = String.format(EmailConstants.SUBJECT_ORDER_PREPARING, appName, detailedOrder.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_PREPARING;
        } else if (detailedOrder.getStatus() == OrderStatusEnum.DELIVERING) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_DELIVERING;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_DELIVERING;
            subject = String.format(EmailConstants.SUBJECT_ORDER_DELIVERING, appName, detailedOrder.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_DELIVERING;
        } else if (detailedOrder.getStatus() == OrderStatusEnum.DELIVERED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_DELIVERED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_DELIVERED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_DELIVERED, appName, detailedOrder.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_DELIVERED;
        } else if (detailedOrder.getStatus() == OrderStatusEnum.CANCELLED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_CANCELLED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_CANCELLED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_CANCELLED, appName, detailedOrder.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_CANCELLED;
        } else if (detailedOrder.getStatus() == OrderStatusEnum.COMPLETED) {
            // Check if this is a Rejected Return
            if (detailedOrder.getReturnRequestedAt() != null && detailedOrder.getAdminReturnNote() != null
                    && !detailedOrder.getAdminReturnNote().isBlank()) {
                emailHeadline = EmailConstants.HEADLINE_ORDER_RETURN_REJECTED;
                subHeadline = EmailConstants.SUB_HEADLINE_ORDER_RETURN_REJECTED;
                subject = String.format(EmailConstants.SUBJECT_ORDER_RETURN_REJECTED, appName, detailedOrder.getOrderCode());
                statusText = EmailConstants.STATUS_TEXT_RETURN_REJECTED;
            } else {
                emailHeadline = EmailConstants.HEADLINE_ORDER_COMPLETED;
                subHeadline = EmailConstants.SUB_HEADLINE_ORDER_COMPLETED;
                subject = String.format(EmailConstants.SUBJECT_ORDER_STATUS_UPDATE, appName, detailedOrder.getOrderCode());
                statusText = EmailConstants.STATUS_TEXT_COMPLETED;
            }
        } else if (detailedOrder.getStatus() == OrderStatusEnum.RETURNED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_RETURNED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_RETURNED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_RETURNED, appName, detailedOrder.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_RETURNED;
        } else if (detailedOrder.getStatus() == OrderStatusEnum.RETURN_REQUESTED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_RETURN_REQUESTED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_RETURN_REQUESTED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_RETURN_REQUESTED, appName, detailedOrder.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_RETURN_REQUESTED;
        } else if (detailedOrder.getStatus() == OrderStatusEnum.REFUND_PENDING) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_REFUND_PENDING;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_REFUND_PENDING;
            subject = String.format(EmailConstants.SUBJECT_ORDER_REFUND_PENDING, appName, detailedOrder.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_REFUND_PENDING;
        } else if (detailedOrder.getStatus() == OrderStatusEnum.REFUNDED) {
            emailHeadline = EmailConstants.HEADLINE_ORDER_REFUNDED;
            subHeadline = EmailConstants.SUB_HEADLINE_ORDER_REFUNDED;
            subject = String.format(EmailConstants.SUBJECT_ORDER_REFUNDED, appName, detailedOrder.getOrderCode());
            statusText = EmailConstants.STATUS_TEXT_REFUNDED;
        }

        context.setVariable(EmailConstants.VAR_EMAIL_HEADLINE, emailHeadline);
        context.setVariable(EmailConstants.VAR_SUB_HEADLINE, subHeadline);
        context.setVariable(EmailConstants.VAR_ORDER_STATUS, detailedOrder.getStatus().name());
        context.setVariable(EmailConstants.VAR_ORDER_STATUS_TEXT, statusText);

        String htmlBody = templateEngine.process("email/orders/confirmation", context);
        self.sendHtmlEmail(to, subject, htmlBody);
    }

    @Async
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void sendOrderRefundRejectedEmail(Order order, String adminNote) {
        Order detailedOrder = orderRepository.findByIdWithDetails(order.getId()).orElse(order);
        String to = detailedOrder.getGuestEmail() != null ? detailedOrder.getGuestEmail()
                : (detailedOrder.getUser() != null ? detailedOrder.getUser().getEmail() : null);
        if (to == null) {
            log.warn(EmailConstants.LOG_NO_RECIPIENT, detailedOrder.getId());
            return;
        }
        log.info("Sending order refund rejected email for order {} to {}", detailedOrder.getOrderCode(), to);

        Context context = prepareContext();
        context.setVariable(EmailConstants.VAR_WEB_URL, frontendUrl);
        context.setVariable(EmailConstants.VAR_ORDER_CODE, detailedOrder.getOrderCode());
        context.setVariable(EmailConstants.VAR_ORDER_DATE,
                detailedOrder.getCreatedAt() != null
                        ? detailedOrder.getCreatedAt().atZone(ZoneId.systemDefault())
                                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        String paymentStatus = EmailConstants.LABEL_PAYMENT_PENDING;
        if (!detailedOrder.getPayments().isEmpty()) {
            Payment p = detailedOrder.getPayments().iterator().next();
            if (p.getStatus() == PaymentStatusEnum.COMPLETED) {
                paymentStatus = EmailConstants.LABEL_PAYMENT_SUCCESS;
            } else if (p.getPaymentMethod() == PaymentMethodEnum.CASH) {
                paymentStatus = EmailConstants.LABEL_PAYMENT_COD;
            }
        }
        context.setVariable(EmailConstants.VAR_PAYMENT_STATUS, paymentStatus);
        context.setVariable(EmailConstants.VAR_FULL_NAME, detailedOrder.getShippingName());
        context.setVariable(EmailConstants.VAR_ITEMS, detailedOrder.getOrderItems());
        context.setVariable(EmailConstants.VAR_ITEM_COUNT,
                detailedOrder.getOrderItems().stream().mapToInt(OrderItem::getQuantity).sum());
        context.setVariable(EmailConstants.VAR_SUBTOTAL, detailedOrder.getSubtotal());
        context.setVariable(EmailConstants.VAR_SHIPPING_FEE, detailedOrder.getShippingFee());
        context.setVariable(EmailConstants.VAR_SHIPPING_METHOD, EmailConstants.LABEL_SHIPPING_DEFAULT);
        context.setVariable(EmailConstants.VAR_DISCOUNT, detailedOrder.getDiscountAmount());
        context.setVariable(EmailConstants.VAR_TOTAL, detailedOrder.getFinalAmount());
        context.setVariable(EmailConstants.VAR_PHONE_NUMBER, detailedOrder.getShippingPhone());
        context.setVariable(EmailConstants.VAR_ADDRESS, detailedOrder.getShippingAddress());
        context.setVariable(EmailConstants.VAR_NOTES, detailedOrder.getNotes());
        String method = EmailConstants.LABEL_METHOD_COD;
        if (!detailedOrder.getPayments().isEmpty()) {
            Payment p = detailedOrder.getPayments().iterator().next();
            if (p.getPaymentMethod() == PaymentMethodEnum.BANK_TRANSFER) {
                method = EmailConstants.LABEL_METHOD_ONLINE;
            }
        }
        context.setVariable(EmailConstants.VAR_PAYMENT_METHOD, method);
        context.setVariable(EmailConstants.VAR_TRACK_ORDER_URL, frontendUrl + "/tracking?code=" + detailedOrder.getOrderCode());
        String cName = detailedOrder.getUser() != null
                ? (detailedOrder.getUser().getFirstName() + " " + detailedOrder.getUser().getLastName())
                : detailedOrder.getShippingName();
        context.setVariable(EmailConstants.VAR_CUSTOMER_NAME, cName);
        context.setVariable(EmailConstants.VAR_CUSTOMER_EMAIL, detailedOrder.getUser() != null ? detailedOrder.getUser().getEmail()
                : (detailedOrder.getGuestEmail() != null ? detailedOrder.getGuestEmail() : EmailConstants.LABEL_NOT_AVAILABLE));
        context.setVariable(EmailConstants.VAR_SHIPPING_EMAIL, detailedOrder.getGuestEmail() != null ? detailedOrder.getGuestEmail()
                : (detailedOrder.getUser() != null ? detailedOrder.getUser().getEmail() : EmailConstants.LABEL_NOT_AVAILABLE));

        context.setVariable(EmailConstants.VAR_EMAIL_HEADLINE, EmailConstants.HEADLINE_ORDER_REFUND_REJECTED);
        context.setVariable(EmailConstants.VAR_SUB_HEADLINE, EmailConstants.SUB_HEADLINE_ORDER_REFUND_REJECTED);
        context.setVariable(EmailConstants.VAR_ORDER_STATUS, detailedOrder.getStatus().name());
        context.setVariable(EmailConstants.VAR_ORDER_STATUS_TEXT, EmailConstants.STATUS_TEXT_REFUND_REJECTED);
        context.setVariable("adminReturnNote", adminNote != null && !adminNote.isBlank() ? adminNote : null);

        String subject = String.format(EmailConstants.SUBJECT_ORDER_REFUND_REJECTED, appName, detailedOrder.getOrderCode());
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
