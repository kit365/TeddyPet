package fpt.teddypet.application.service.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.constants.payments.PaymentConstants;
import fpt.teddypet.application.dto.response.payment.GatewayCallbackResult;
import fpt.teddypet.application.dto.response.payment.PaymentResult;
import fpt.teddypet.application.exception.PaymentException;
import fpt.teddypet.application.port.input.orders.order.OrderService;
import fpt.teddypet.application.port.input.payment.PaymentService;
import fpt.teddypet.application.port.output.payment.PaymentGatewayPort;
import fpt.teddypet.application.port.output.payment.PaymentRepositoryPort;
import fpt.teddypet.application.util.OrderValidator;
import fpt.teddypet.domain.entity.BankInformation;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.banks.VietnamBankEnum;
import fpt.teddypet.domain.entity.Payment;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;
import fpt.teddypet.domain.enums.payments.PaymentTypeEnum;
import fpt.teddypet.domain.exception.PaymentDomainException;
import fpt.teddypet.infrastructure.persistence.postgres.repository.user.BankInformationRepository;
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
    private final BankInformationRepository bankInformationRepository;
    private final ObjectMapper objectMapper;
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

        String paymentUrl;
        try {
            paymentUrl = gatewayAdapter.buildPaymentUrl(order, ipAddress, returnUrl);
        } catch (PaymentException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            // PayOS báo "Đơn thanh toán đã tồn tại" khi user bấm thanh toán lần 2
            // → cố gắng trả về link đang PENDING trong DB (nếu có), tránh tạo trùng.
            if (msg.contains("đã tồn tại") || msg.contains("already exist")) {
                Optional<Payment> existing = paymentRepositoryPort
                        .findFirstByOrderIdAndPaymentGatewayAndStatusOrderByCreatedAtDesc(
                                orderId, gateway.name(), PaymentStatusEnum.PENDING);
                if (existing.isPresent() && existing.get().getCheckoutUrl() != null
                        && !existing.get().getCheckoutUrl().isBlank()) {
                    log.info("Returning stored checkout URL for order {} (PayOS order already exists).", orderId);
                    return existing.get().getCheckoutUrl();
                }
                throw new PaymentException(
                        "Đơn thanh toán đã được tạo trước đó. Vui lòng kiểm tra email hoặc thử lại sau vài phút.");
            }
            throw e;
        }

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
                .paymentType(PaymentTypeEnum.ORDER_PAYMENT)
                .paymentGateway(gateway.name())
                .transactionId(transactionRef) // Crucial for finding it back in callback
                .notes(PaymentConstants.Messages.MSG_PAYMENT_INITIATED + gateway.getDisplayName())
                .checkoutUrl(paymentUrl)
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
        paymentRepositoryPort.findByTransactionId(result.transactionId())
                .ifPresentOrElse(payment -> {
                    // Idempotency check (domain logic)
                    if (payment.isAlreadyCompleted()) {
                        log.warn(PaymentConstants.Messages.LOG_DUPLICATE_CALLBACK,
                                result.transactionId(), payment.getStatus());
                        return;
                    }

                    // Callback có thể đến muộn / bị retry: nếu payment không còn ở trạng thái cho phép complete
                    // (vd: VOIDED do đơn đã bị hủy/return/timeout) thì bỏ qua để tránh 500.
                    if (!payment.canComplete()) {
                        log.warn("Ignore callback txnId={} because payment status is {} (cannot complete).",
                                result.transactionId(), payment.getStatus());
                        return;
                    }

                    try {
                        // Đánh dấu payment đã hoàn tất, lưu payload từ gateway
                        payment.complete(gateway.getDisplayName());
                        payment.setGatewayResponseCode(result.gatewayResponseCode());
                        payment.setGatewayRawPayload(result.rawPayload());
                        paymentRepositoryPort.save(payment);

                        Order order = payment.getOrder();

                        // Sau khi thanh toán online thành công: chuyển đơn sang trạng thái PAID (ĐÃ THANH TOÁN),
                        // admin sẽ chủ động bấm "Bắt đầu đóng gói" để chuyển sang PROCESSING.
                        if (order.getStatus() == OrderStatusEnum.CONFIRMED) {
                            orderService.updateOrderStatus(order.getId(), OrderStatusEnum.PAID);
                        }

                        if (gateway == PaymentGatewayEnum.PAYOS && result.rawPayload() != null && !result.rawPayload().isBlank()) {
                            log.info("💰 PayOS Success JSON Payload for order {}: \n{}", order.getId(), result.rawPayload());
                            savePayerBankInfoFromPayosPayload(result.rawPayload(), payment);
                        }

                        log.info(PaymentConstants.Messages.PAYMENT_COMPLETED,
                                gateway, result.transactionId(), order.getId());
                    } catch (PaymentDomainException e) {
                        log.error("Domain violation: {}", e.getMessage());
                        throw e;
                    } catch (Exception e) {
                        log.error("Failed to update payment/order for txnId: {}", result.transactionId(), e);
                        throw new PaymentException("Failed to update payment: " + e.getMessage(), e);
                    }
                }, () -> log.warn(PaymentConstants.Messages.PAYMENT_NOT_FOUND, result.transactionId()));
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

    /** Mã Napas (PayOS counterAccountBankId) -> mã ngân hàng nội bộ (VietnamBankEnum), để suy ra tên khi PayOS không trả bankName. */
    private static final Map<String, String> NAPAS_CODE_TO_BANK_CODE = Map.ofEntries(
            Map.entry("970436", "VCB"), Map.entry("970418", "BIDV"), Map.entry("970415", "CTG"),
            Map.entry("970416", "ACB"), Map.entry("970407", "TCB"), Map.entry("970422", "MBB"),
            Map.entry("970432", "VPB"), Map.entry("970423", "TPB"), Map.entry("970443", "SHB"),
            Map.entry("970403", "STB"), Map.entry("970441", "VIB"), Map.entry("970437", "HDB"),
            Map.entry("970431", "EIB"), Map.entry("970448", "OCB"), Map.entry("970426", "MSB"),
            Map.entry("970429", "SCB"), Map.entry("970400", "SGB"), Map.entry("970438", "BVB"),
            Map.entry("970452", "KLB"), Map.entry("970425", "ABB"), Map.entry("970440", "SEAB"),
            Map.entry("970430", "PGB"), Map.entry("970419", "NCB"), Map.entry("970434", "IVB"),
            Map.entry("970427", "VRB"), Map.entry("970458", "UOB"), Map.entry("970442", "HSBC"),
            Map.entry("970410", "SCVN"));

    /**
     * Khi webhook thanh toán thành công (PayOS/VietQR), nếu payload có thông tin người chuyển (counterAccount*)
     * thì lưu vào bank_information theo order. Chỉ lưu khi có ít nhất một trong counterAccountNumber hoặc counterAccountName
     * (thanh toán chuyển khoản); nếu thanh toán bằng MoMo/ví/ phương thức khác không có thông tin ngân hàng thì bỏ qua,
     * khi khách cần hoàn tiền sẽ yêu cầu khách nhập và tạo bank_information lúc đó.
     */
    private void savePayerBankInfoFromPayosPayload(String rawPayload, Payment payment) {
        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String accountNumber = root.path("counterAccountNumber").asText("").trim();
            String accountName = root.path("counterAccountName").asText("").trim();
            String bankCode = root.path("counterAccountBankId").asText("").trim();
            String bankName = root.path("counterAccountBankName").asText("").trim();

            // Thanh toán qua MoMo/ví/PP khác ngoài ngân hàng: payload không có counterAccount* → không lưu bank_information
            if (accountNumber.isBlank() && accountName.isBlank()) {
                log.debug("Payment success payload has no counter-account info (e.g. MoMo/ví), skip saving bank_information for order {}", payment.getOrder().getId());
                return;
            }

            Order order = payment.getOrder();
            UUID orderId = order.getId();
            boolean isGuest = order.getUser() == null;
            String accountType = isGuest ? BankInformation.ACCOUNT_TYPE_GUEST : BankInformation.ACCOUNT_TYPE_CUSTOMER;
            UUID userId = isGuest ? null : order.getUser().getId();
            String userEmail = isGuest ? order.getGuestEmail() : null;

            // Lưu tạm thông tin có thể lưu; trường thiếu dùng placeholder, khi khách cần hoàn tiền sẽ yêu cầu cập nhật lại
            if (bankCode.isBlank()) bankCode = "PAYOS";
            if (bankName.isBlank()) {
                String internalCode = NAPAS_CODE_TO_BANK_CODE.get(bankCode);
                bankName = VietnamBankEnum.fromCode(internalCode != null ? internalCode : bankCode)
                        .map(VietnamBankEnum::getBankName)
                        .orElse("PayOS");
            }
            if (accountNumber.isBlank()) accountNumber = "N/A";
            if (accountName.isBlank()) accountName = "N/A";

            // 1. Check for duplicate account by (accountNumber, bankCode, user/email) to reuse accounts
            Optional<BankInformation> existingOpt = Optional.empty();
            if (userId != null) {
                existingOpt = bankInformationRepository
                        .findByAccountNumberAndBankCodeAndUserIdAndIsDeletedFalse(accountNumber, bankCode, userId)
                        .stream().findFirst();
            } else if (userEmail != null) {
                existingOpt = bankInformationRepository
                        .findByAccountNumberAndBankCodeAndUserEmailAndIsDeletedFalse(accountNumber, bankCode, userEmail)
                        .stream().findFirst();
            }

            // 2. Fallback to check by orderId (idempotency for same order retries/different account)
            if (existingOpt.isEmpty()) {
                existingOpt = bankInformationRepository
                        .findByOrderIdAndIsDeletedFalseOrderByUpdatedAtDesc(orderId)
                        .stream().findFirst();
            }

            BankInformation entity;
            if (existingOpt.isPresent()) {
                entity = existingOpt.get();
                entity.setAccountNumber(accountNumber);
                entity.setAccountHolderName(accountName);
                entity.setBankCode(bankCode);
                entity.setBankName(bankName);
                entity.setOrderId(orderId); // Update link to most recent order
            } else {
                entity = BankInformation.builder()
                        .orderId(orderId)
                        .userId(userId)
                        .userEmail(userEmail)
                        .bookingId(null)
                        .accountNumber(accountNumber)
                        .accountHolderName(accountName)
                        .bankCode(bankCode)
                        .bankName(bankName)
                        .accountType(accountType)
                        .isVerify(false)
                        .isDefault(false)
                        .isActive(true)
                        .isDeleted(false)
                        .build();
            }
            bankInformationRepository.save(entity);
            log.info("Saved payer bank info from PayOS for order {} (accountType={}).", orderId, accountType);
        } catch (Exception e) {
            log.warn("Could not save payer bank info from PayOS payload for payment {}: {}", payment.getId(), e.getMessage());
        }
    }
}
