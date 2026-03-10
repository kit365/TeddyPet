package fpt.teddypet.application.service.payment;

import fpt.teddypet.application.constants.payments.PaymentConstants;
import fpt.teddypet.application.dto.response.payment.GatewayCallbackResult;
import fpt.teddypet.application.dto.response.payment.PaymentResult;
import fpt.teddypet.application.exception.PaymentException;
import fpt.teddypet.application.port.input.orders.order.OrderService;
import fpt.teddypet.application.port.input.payment.PaymentService;
import fpt.teddypet.application.port.output.payment.PaymentGatewayPort;
import fpt.teddypet.application.port.output.payment.PaymentRepositoryPort;
import fpt.teddypet.application.util.OrderValidator;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.entity.Payment;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;
import fpt.teddypet.domain.exception.PaymentDomainException;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentApplicationService implements PaymentService {

    private final OrderService orderService;
    private final PaymentRepositoryPort paymentRepositoryPort;
    private final List<PaymentGatewayPort<?>> gatewayAdapters;
    private final fpt.teddypet.application.port.output.NotificationPublisherPort notificationPublisherPort;
    private Map<PaymentGatewayEnum, PaymentGatewayPort<?>> gatewayMap;

    @PostConstruct
    private void initializeGatewayMap() {
        this.gatewayMap = gatewayAdapters.stream()
                .collect(Collectors.toUnmodifiableMap(
                        PaymentGatewayPort::getGateway,
                        Function.identity()));
        log.info("✅ Initialized {} payment gateways", gatewayMap.size());
    }

    @Override
    @Transactional
    public String initiatePayment(UUID orderId, PaymentGatewayEnum gateway,
            String returnUrl, String ipAddress) {
        Order order = orderService.getById(orderId);
        OrderValidator.validateForPayment(order);
        PaymentGatewayPort<?> gatewayAdapter = getGatewayAdapter(gateway);

        String paymentUrl = gatewayAdapter.buildPaymentUrl(order, ipAddress, returnUrl);

        String transactionRef = (order.getNumericCode() != null)
                ? String.valueOf(order.getNumericCode())
                : order.getOrderCode();

        // Check if payment already exists for this transaction
        Optional<Payment> existingPayment = paymentRepositoryPort.findByTransactionId(transactionRef);

        if (existingPayment.isPresent()) {
            Payment payment = existingPayment.get();
            if (payment.getStatus() == PaymentStatusEnum.PENDING) {
                log.info("Reusing existing PENDING payment for order: {}", orderId);
                return paymentUrl;
            }
        }

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getFinalAmount())
                .paymentMethod(gateway.getPaymentMethod())
                .status(PaymentStatusEnum.PENDING)
                .paymentGateway(gateway.name())
                .transactionId(transactionRef)
                .notes(PaymentConstants.Messages.MSG_PAYMENT_INITIATED + gateway.getDisplayName())
                .build();

        paymentRepositoryPort.save(payment);
        log.info(PaymentConstants.Messages.PAYMENT_INITIATED,
                gateway, orderId, order.getFinalAmount());

        return paymentUrl;
    }

    @Override
    @Transactional
    public PaymentResult processPaymentCallback(PaymentGatewayEnum gateway,
            Object callbackData,
            HttpServletRequest request) {
        log.info("🔄 Processing callback for gateway: {}", gateway);
        PaymentGatewayPort<?> adapter = getGatewayAdapter(gateway);

        try {
            @SuppressWarnings("unchecked")
            PaymentGatewayPort<Object> typedAdapter = (PaymentGatewayPort<Object>) adapter;

            GatewayCallbackResult gwResult = typedAdapter.handleCallback(callbackData, request);
            log.info("📋 Callback result - TransactionId: {}, Success: {}", gwResult.transactionId(),
                    gwResult.success());

            if (!gwResult.success()) {
                markPaymentFailed(gwResult, gateway);
                return gwResult.toPaymentResult(gateway.name());
            }

            updatePaymentAndOrder(gwResult, gateway);
            return gwResult.toPaymentResult(gateway.name());

        } catch (ClassCastException e) {
            log.error(PaymentConstants.Messages.LOG_TYPE_MISMATCH, gateway, e);
            throw new PaymentException("Invalid callback data type for gateway: " + gateway);
        }
    }

    @Override
    public void validateOrderForPayment(Order order) {
        OrderValidator.validateForPayment(order);
    }

    // Private helpers

    private PaymentGatewayPort<?> getGatewayAdapter(PaymentGatewayEnum gateway) {
        PaymentGatewayPort<?> adapter = gatewayMap.get(gateway);
        if (adapter == null) {
            throw new PaymentException.GatewayNotSupportedException(gateway.name());
        }
        return adapter;
    }

    private void updatePaymentAndOrder(GatewayCallbackResult result, PaymentGatewayEnum gateway) {
        log.info("🔍 Looking for payment with transactionId: {}", result.transactionId());

        Payment payment = paymentRepositoryPort.findByTransactionId(result.transactionId())
                .orElseThrow(() -> {
                    log.error("❌ Payment not found for transactionId: {}", result.transactionId());
                    return new PaymentException.PaymentNotFoundException(result.transactionId());
                });

        log.info("✅ Found payment: id={}, status={}", payment.getId(), payment.getStatus());

        if (payment.isAlreadyCompleted()) {
            log.warn(PaymentConstants.Messages.LOG_DUPLICATE_CALLBACK,
                    result.transactionId(), payment.getStatus());
            return;
        }

        try {
            payment.complete(gateway.getDisplayName());
            paymentRepositoryPort.save(payment);

            Order order = payment.getOrder();
            orderService.updateOrderStatus(order.getId(), OrderStatusEnum.CONFIRMED);

            log.info(PaymentConstants.Messages.PAYMENT_COMPLETED,
                    gateway, result.transactionId(), order.getId());

            // Send notification to Admin
            notificationPublisherPort.sendToTopic("admin-orders",
                    fpt.teddypet.application.dto.response.notification.NotificationResponse.builder()
                            .title("Thanh toán thành công")
                            .message("Đơn hàng #" + order.getOrderCode() + " đã được thanh toán thành công.")
                            .type("PAYMENT_SUCCESS")
                            .targetUrl("/admin/order/detail/" + order.getId())
                            .timestamp(java.time.LocalDateTime.now())
                            .build());

            // Send notification to Customer
            if (order.getUser() != null) {
                notificationPublisherPort.sendToUser(order.getUser().getUsername(),
                        fpt.teddypet.application.dto.response.notification.NotificationResponse.builder()
                                .title("Thanh toán thành công")
                                .message("Chúng tôi đã nhận được thanh toán cho đơn hàng #" + order.getOrderCode()
                                        + ". Cảm ơn bạn!")
                                .type("PAYMENT_SUCCESS_CUSTOMER")
                                .targetUrl("/dashboard/orders/" + order.getId())
                                .timestamp(java.time.LocalDateTime.now())
                                .build());
            }
        } catch (PaymentDomainException e) {
            log.error("Domain violation: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Failed to update payment/order for txnId: {}", result.transactionId(), e);
            throw new PaymentException("Failed to update payment: " + e.getMessage(), e);
        }
    }

    private void markPaymentFailed(GatewayCallbackResult result, PaymentGatewayEnum gateway) {
        paymentRepositoryPort.findByTransactionId(result.transactionId())
                .ifPresentOrElse(
                        payment -> {
                            try {
                                payment.fail(result.message());
                                paymentRepositoryPort.save(payment);
                                log.warn(PaymentConstants.Messages.LOG_PAYMENT_FAILED_WARN,
                                        gateway, result.transactionId());

                                // Notify customer about failure
                                Order order = payment.getOrder();
                                if (order.getUser() != null) {
                                    notificationPublisherPort.sendToUser(order.getUser().getUsername(),
                                            fpt.teddypet.application.dto.response.notification.NotificationResponse
                                                    .builder()
                                                    .title("Thanh toán thất bại")
                                                    .message("Thanh toán cho đơn hàng #" + order.getOrderCode()
                                                            + " không thành công. Lý do: " + result.message())
                                                    .type("PAYMENT_FAILED")
                                                    .targetUrl("/dashboard/orders/" + order.getId())
                                                    .timestamp(java.time.LocalDateTime.now())
                                                    .build());
                                }
                            } catch (Exception e) {
                                log.error("Failed to mark payment as failed for txnId: {}",
                                        result.transactionId(), e);
                            }
                        },
                        () -> log.warn(PaymentConstants.Messages.PAYMENT_NOT_FOUND, result.transactionId()));
    }
}
