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

        // Use orderCode or numericCode as the primary transaction identifier for
        // searching during callbacks
        String transactionRef = (order.getNumericCode() != null)
                ? String.valueOf(order.getNumericCode())
                : order.getOrderCode();

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getFinalAmount())
                .paymentMethod(gateway.getPaymentMethod())
                .status(PaymentStatusEnum.PENDING)
                .paymentGateway(gateway.name())
                .transactionId(transactionRef) // Crucial for finding it back in callback
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
        PaymentGatewayPort<?> adapter = getGatewayAdapter(gateway);

        try {
            @SuppressWarnings("unchecked")
            PaymentGatewayPort<Object> typedAdapter = (PaymentGatewayPort<Object>) adapter;

            // Adapter handles ALL gateway logic
            GatewayCallbackResult gwResult = typedAdapter.handleCallback(callbackData, request);

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
        Payment payment = paymentRepositoryPort.findByTransactionId(result.transactionId())
                .orElseThrow(() -> new PaymentException.PaymentNotFoundException(result.transactionId()));

        // Idempotency check (domain logic)
        if (payment.isAlreadyCompleted()) {
            log.warn(PaymentConstants.Messages.LOG_DUPLICATE_CALLBACK,
                    result.transactionId(), payment.getStatus());
            return;
        }

        try {
            payment.complete(gateway.getDisplayName());
            payment.setGatewayResponseCode(result.gatewayResponseCode());
            payment.setGatewayRawPayload(result.rawPayload());
            paymentRepositoryPort.save(payment);

            Order order = payment.getOrder();
            orderService.updateOrderStatus(order.getId(), OrderStatusEnum.PROCESSING);

            log.info(PaymentConstants.Messages.PAYMENT_COMPLETED,
                    gateway, result.transactionId(), order.getId());
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
                                payment.setGatewayResponseCode(result.gatewayResponseCode());
                                payment.setGatewayRawPayload(result.rawPayload());
                                paymentRepositoryPort.save(payment);
                                log.warn(PaymentConstants.Messages.LOG_PAYMENT_FAILED_WARN,
                                        gateway, result.transactionId());
                            } catch (Exception e) {
                                log.error("Failed to mark payment as failed for txnId: {}",
                                        result.transactionId(), e);
                            }
                        },
                        () -> log.warn(PaymentConstants.Messages.PAYMENT_NOT_FOUND, result.transactionId()));
    }
}
