package fpt.teddypet.application.service.orders.cart;

import fpt.teddypet.application.constants.orders.order.OrderLogMessages;
import fpt.teddypet.application.port.input.auth.OtpService;
import fpt.teddypet.application.constants.orders.order.OrderMessages;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.common.SortDirection;
import fpt.teddypet.application.dto.request.orders.order.*;
import fpt.teddypet.application.dto.response.orders.order.OrderResponse;
import fpt.teddypet.application.mapper.orders.order.OrderMapper;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.input.AppSettingService;
import fpt.teddypet.application.port.input.orders.cart.CartService;
import fpt.teddypet.application.port.input.orders.order.OrderItemService;
import fpt.teddypet.application.constants.settings.AppSettingsConstants;
import fpt.teddypet.application.port.input.orders.order.OrderService;
import fpt.teddypet.application.port.input.products.ProductVariantService;
import fpt.teddypet.application.port.input.user.UserAddressService;
import fpt.teddypet.application.port.input.promotions.PromotionService;
import fpt.teddypet.application.port.input.promotions.PromotionUsageService;
import fpt.teddypet.application.port.input.feedback.FeedbackService;
import fpt.teddypet.domain.entity.promotions.Promotion;
import fpt.teddypet.application.port.output.orders.order.OrderRepositoryPort;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.util.SecurityUtil;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.entity.OrderItem;
import fpt.teddypet.domain.entity.Payment;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.entity.UserAddress;
import fpt.teddypet.domain.enums.UserStatusEnum;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.orders.OrderTypeEnum;
import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderApplicationService implements OrderService {

    private final OrderRepositoryPort orderRepositoryPort;
    private final OrderMapper orderMapper;
    private final UserService userService;
    private final OrderItemService orderItemService;
    private final CartService cartService;
    private final UserAddressService userAddressService;
    private final OtpService otpService;
    private final ProductVariantService productVariantService;
    private final EmailServicePort emailServicePort;
    private final AppSettingService appSettingService;
    private final PromotionService promotionService;
    private final PromotionUsageService promotionUsageService;
    private final FeedbackService feedbackService;

    private BigDecimal calculateDiscount(Order order, Promotion promotion) {
        if (promotion == null || !promotion.isValid()) {
            return BigDecimal.ZERO;
        }

        if (order.getSubtotal().compareTo(
                promotion.getMinOrderAmount() != null ? promotion.getMinOrderAmount() : BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount;
        if (promotion.getDiscountType() == fpt.teddypet.domain.enums.promotions.DiscountTypeEnum.PERCENTAGE) {
            discount = order.getSubtotal().multiply(promotion.getDiscountValue()).divide(BigDecimal.valueOf(100), 2,
                    RoundingMode.HALF_UP);
            if (promotion.getMaxDiscountAmount() != null && discount.compareTo(promotion.getMaxDiscountAmount()) > 0) {
                discount = promotion.getMaxDiscountAmount();
            }
        } else {
            discount = promotion.getDiscountValue();
        }

        return discount.min(order.getSubtotal());
    }

    private void applyPromotionToOrder(Order order, String voucherCode, UUID userId) {
        if (voucherCode == null || voucherCode.isBlank()) {
            return;
        }

        try {
            Promotion promotion = promotionService.getByCode(voucherCode);
            if (promotion != null && promotion.isValid()) {
                // Check user usage limit if userId is present
                if (userId != null) {
                    if (!promotionUsageService.canUserUsePromotion(userId, promotion.getId())) {
                        log.warn("User {} has exceeded usage limit for promotion {}", userId, voucherCode);
                        return;
                    }
                }

                BigDecimal discount = calculateDiscount(order, promotion);
                order.setDiscountAmount(discount);
                order.setVoucherCode(voucherCode);
                log.info("Applied promotion: {}, discount: {}", voucherCode, discount);
            }
        } catch (Exception e) {
            log.warn("Could not apply promotion {}: {}", voucherCode, e.getMessage());
        }
    }

    private OrderResponse toEnhancedResponse(Order order) {
        Double distance = calculateDistanceKm(order);
        return orderMapper.toResponseWithDistance(order, distance);
    }

    private Double calculateDistanceKm(Order order) {
        Double destLat;
        Double destLng;

        if (order.getUserAddress() != null) {
            destLat = order.getUserAddress().getLatitude();
            destLng = order.getUserAddress().getLongitude();
        } else {
            destLat = order.getLatitude();
            destLng = order.getLongitude();
        }

        if (destLat == null || destLng == null) {
            return null;
        }

        try {
            double shopLat = Double.parseDouble(appSettingService.getSetting(
                    AppSettingsConstants.SHOP_LAT, AppSettingsConstants.DEFAULT_SHOP_LAT));
            double shopLng = Double.parseDouble(appSettingService.getSetting(
                    AppSettingsConstants.SHOP_LNG, AppSettingsConstants.DEFAULT_SHOP_LNG));

            double distance = fpt.teddypet.application.util.DistanceUtil.calculateDistance(
                    shopLat, shopLng,
                    destLat,
                    destLng);

            // Round to 1 decimal place
            return Math.round(distance * 10.0) / 10.0;
        } catch (Exception e) {
            log.error("Error calculating distance for order {}", order.getId(), e);
            return null;
        }
    }

    @Override
    @Transactional
    public void createOrder(OrderRequest request, UUID userId) {
        log.info(OrderLogMessages.LOG_ORDER_CREATE_START, userId);

        if (request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException(OrderMessages.MESSAGE_ORDER_EMPTY_ITEMS);
        }

        Order order = buildOrder(request, userId);

        log.info(OrderLogMessages.LOG_ORDER_CALCULATE_PRICING,
                order.getSubtotal(), order.getDiscountAmount(),
                order.getShippingFee(), order.getFinalAmount());

        switch (request.paymentMethod()) {
            case CASH -> createCashOrder(order);
            case BANK_TRANSFER, CREDIT_CARD, E_WALLET -> throw new UnsupportedOperationException(
                    OrderMessages.MESSAGE_ONLINE_PAYMENT_NOT_IMPLEMENTED);
        }

        // Clear cart after successful order creation
        cartService.clearCart();
        log.info(OrderLogMessages.LOG_ORDER_CART_CLEARED, userId);
    }

    private void createCashOrder(Order order) {
        Payment payment = Payment.builder()
                .amount(order.getFinalAmount())
                .paymentMethod(PaymentMethodEnum.CASH)
                .status(PaymentStatusEnum.PENDING)
                .notes(OrderMessages.MESSAGE_NOTE_PAYMENT_CASH)
                .build();

        order.addPayment(payment);

        Order savedOrder = orderRepositoryPort.save(order);

        log.info(OrderLogMessages.LOG_ORDER_CREATE_SUCCESS, savedOrder.getId(), savedOrder.getOrderCode());
    }

    private Order buildOrder(OrderRequest request, UUID userId) {
        User user = userService.getById(userId);

        if (user.getStatus() != UserStatusEnum.ACTIVE) {
            throw new IllegalStateException(OrderMessages.MESSAGE_USER_NOT_VERIFIED);
        }

        // Biến để lưu thông tin shipping
        String finalReceiverName;
        String finalReceiverPhone;
        String finalShippingAddress;
        UserAddress userAddress = null;

        // Nếu có userAddressId -> lấy từ địa chỉ đã lưu
        if (request.userAddressId() != null) {
            userAddress = userAddressService.getEntityById(request.userAddressId(), userId);
            finalReceiverName = userAddress.getFullName();
            finalReceiverPhone = userAddress.getPhone();
            finalShippingAddress = userAddress.getAddress();
            log.info("Sử dụng địa chỉ đã lưu: id={}, address={}", userAddress.getId(), finalShippingAddress);
        } else {
            // Nếu không có userAddressId -> lấy từ request (nhập thủ công)
            finalReceiverName = request.receiverName();
            finalReceiverPhone = request.receiverPhone();
            finalShippingAddress = request.shippingAddress();

            // Validate khi nhập thủ công
            if (finalShippingAddress == null || finalShippingAddress.isBlank()) {
                throw new IllegalArgumentException(OrderMessages.MESSAGE_ADDRESS_REQUIRED);
            }
        }

        // Fallback cho tên người nhận nếu rỗng
        if (finalReceiverName == null || finalReceiverName.isBlank()) {
            finalReceiverName = (user.getFirstName() != null ? user.getFirstName() : "") +
                    (user.getLastName() != null ? " " + user.getLastName() : "");
            if (finalReceiverName.trim().isEmpty()) {
                finalReceiverName = user.getUsername();
            }
        }

        // Fallback cho số điện thoại nếu rỗng
        if (finalReceiverPhone == null || finalReceiverPhone.isBlank()) {
            finalReceiverPhone = user.getPhoneNumber();
            if (finalReceiverPhone == null || finalReceiverPhone.isBlank()) {
                throw new IllegalArgumentException(OrderMessages.MESSAGE_RECEIVER_PHONE_REQUIRED);
            }
        }

        // Build Order
        Order order = Order.builder()
                .user(user)
                .userAddress(userAddress) // Lưu reference đến địa chỉ đã lưu (có thể null)
                .status(OrderStatusEnum.PENDING)
                .orderType(OrderTypeEnum.ONLINE)

                // SNAPSHOT - luôn lưu dù dùng địa chỉ đã lưu hay nhập tay
                .shippingName(finalReceiverName)
                .shippingPhone(finalReceiverPhone)
                .shippingAddress(finalShippingAddress)
                .latitude(request.latitude())
                .longitude(request.longitude())

                .notes(request.note())
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .build();

        order.generateAndSetOrderCode();

        createOrderItems(order, request.items());

        order.calculateFinalAmount();

        return order;
    }

    private void createOrderItems(Order order, List<OrderItemRequest> itemRequests) {
        List<OrderItem> orderItems = orderItemService.createOrderItemsFromRequests(itemRequests);

        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderItem orderItem : orderItems) {
            order.addOrderItem(orderItem);
            subtotal = subtotal.add(orderItem.getTotalPrice());
        }

        // Deduct stock for each item
        for (OrderItemRequest itemRequest : itemRequests) {
            productVariantService.deductStock(itemRequest.variantId(), itemRequest.quantity());
        }

        order.setSubtotal(subtotal);
    }

    @Override
    @Transactional
    public void updateOrderStatus(UUID orderId, OrderStatusEnum status) {
        log.info(OrderLogMessages.LOG_ORDER_UPDATE_START, orderId);
        Order order = getById(orderId);

        OrderStatusEnum oldStatus = order.getStatus();
        order.setStatus(status);

        // Update delivering time if moving to DELIVERING
        if (status == OrderStatusEnum.DELIVERING && oldStatus != OrderStatusEnum.DELIVERING) {
            order.setDeliveringAt(java.time.LocalDateTime.now());
        }

        // Update delivered time if moving to DELIVERED
        if (status == OrderStatusEnum.DELIVERED && oldStatus != OrderStatusEnum.DELIVERED) {
            order.setDeliveredAt(java.time.LocalDateTime.now());

            // Auto-complete payment for COD orders when delivered
            // (Customer has paid cash to the shipper)
            if (order.getPayments() != null && !order.getPayments().isEmpty()) {
                for (Payment payment : order.getPayments()) {
                    if (payment.getPaymentMethod() == PaymentMethodEnum.CASH
                            && payment.getStatus() == PaymentStatusEnum.PENDING) {
                        payment.setStatus(PaymentStatusEnum.COMPLETED);
                        payment.setCompletedAt(java.time.Instant.now());
                        payment.setNotes(OrderMessages.MESSAGE_NOTE_COD_AUTO_COMPLETED);
                        log.info("Auto-completed COD payment for order: {}", orderId);
                    }
                }
            }
        }

        // Return stock if moving to CANCELLED or RETURNED
        if ((status == OrderStatusEnum.CANCELLED && oldStatus != OrderStatusEnum.CANCELLED) ||
                (status == OrderStatusEnum.RETURNED && oldStatus != OrderStatusEnum.RETURNED)) {
            returnOrderStock(order);
        }

        Order savedOrder = orderRepositoryPort.save(order);
        log.info(OrderLogMessages.LOG_ORDER_STATUS_UPDATE, orderId, oldStatus, status);

        // Send email notification only if status changed
        if (oldStatus != status) {
            sendOrderStatusEmail(savedOrder);
        }

        // Send feedback email if completed
        if (status == OrderStatusEnum.COMPLETED && oldStatus != OrderStatusEnum.COMPLETED) {
            feedbackService.sendFeedbackEmailsForOrder(orderId);
        }
    }

    private void returnOrderStock(Order order) {
        if (order.getOrderItems() != null) {
            for (fpt.teddypet.domain.entity.OrderItem item : order.getOrderItems()) {
                if (item.getVariant() != null) {
                    productVariantService.returnStock(item.getVariant().getVariantId(), item.getQuantity());
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getByIdResponse(UUID orderId) {
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_ID, orderId);
        Order order = getById(orderId);
        return toEnhancedResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getByOrderCodeResponse(String orderCode) {
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_CODE, orderCode);
        Order order = getByOrderCode(orderCode);
        return toEnhancedResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Order getById(UUID orderId) {
        return orderRepositoryPort.findById(orderId);
    }

    @Override
    @Transactional(readOnly = true)
    public Order getByOrderCode(String orderCode) {
        return orderRepositoryPort.findByOrderCode(orderCode);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrders(OrderSearchRequest request) {
        Pageable pageable = buildPageable(request);
        Page<Order> orders = orderRepositoryPort.findAll(pageable);
        log.info(OrderLogMessages.LOG_ORDER_GET_ALL, orders.getTotalElements());
        return PageResponse.fromPage(orders.map(this::toEnhancedResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getOrdersByStatus(OrderStatusEnum status, OrderSearchRequest request) {
        Pageable pageable = buildPageable(request);
        Page<Order> orders = orderRepositoryPort.findByStatus(status, pageable);
        return PageResponse.fromPage(orders.map(this::toEnhancedResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> searchOrders(OrderSearchRequest request) {
        Pageable pageable = buildPageable(request);
        String keyword = request.keyword() != null ? request.keyword() : "";
        Page<Order> orders = orderRepositoryPort.searchOrders(keyword, pageable);
        return PageResponse.fromPage(orders.map(this::toEnhancedResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(OrderSearchRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Pageable pageable = buildPageable(request);
        Page<Order> orders = orderRepositoryPort.findByUserId(currentUserId, pageable);
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_USER, currentUserId, orders.getTotalElements());
        return PageResponse.fromPage(orders.map(this::toEnhancedResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrdersList() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        List<Order> orders = orderRepositoryPort.findByUserId(currentUserId);
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_USER, currentUserId, orders.size());
        return orders.stream()
                .map(this::toEnhancedResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getMyOrderById(UUID orderId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Order order = getById(orderId);
        validateOwnership(orderId, currentUserId);
        return toEnhancedResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getMyOrderByCode(String orderCode) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Order order = getByOrderCode(orderCode);
        validateOwnership(order.getId(), currentUserId);
        return toEnhancedResponse(order);
    }

    @Override
    public void validateOwnership(UUID orderId, UUID userId) {
        Order order = getById(orderId);
        if (!order.getUser().getId().equals(userId)) {
            log.warn(OrderLogMessages.LOG_ORDER_ACCESS_DENIED, userId, orderId);
            throw new AccessDeniedException(OrderMessages.MESSAGE_ORDER_ACCESS_DENIED);
        }
        log.debug(OrderLogMessages.LOG_ORDER_OWNERSHIP_VERIFIED, userId, orderId);
    }

    @Override
    public boolean isOwner(UUID orderId, UUID userId) {
        try {
            Order order = getById(orderId);
            return order.getUser().getId().equals(userId);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    @Transactional
    public void cancelOrder(UUID orderId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        validateOwnership(orderId, currentUserId);

        Order order = getById(orderId);

        if (order.getStatus() == OrderStatusEnum.DELIVERED ||
                order.getStatus() == OrderStatusEnum.CANCELLED) {
            throw new IllegalStateException(OrderMessages.MESSAGE_ORDER_CANNOT_CANCEL);
        }

        order.setStatus(OrderStatusEnum.CANCELLED);

        // Return stock for all items
        returnOrderStock(order);

        orderRepositoryPort.save(order);
        log.info(OrderLogMessages.LOG_ORDER_CANCEL, orderId);
    }

    /**
     * Build Pageable from OrderSearchRequest
     */
    private Pageable buildPageable(OrderSearchRequest request) {
        OrderSortField sortField = request.getSortField();
        Sort.Direction direction = request.getSortDir() == SortDirection.ASC
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return PageRequest.of(request.page(), request.size(),
                Sort.by(direction, sortField.getFieldName()));
    }

    // ========== UNIFIED ORDER CREATION ==========

    @Override
    @Transactional
    public OrderResponse createUnifiedOrder(OrderRequest request, UUID userId) {
        boolean isGuest = (userId == null);

        log.info("Creating {} order", isGuest ? "guest" : "user");
        log.debug("Processing unified order creation..."); // Force recompile

        // Validate items
        if (request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException(OrderMessages.MESSAGE_ORDER_EMPTY_ITEMS);
        }

        Order order;

        if (isGuest) {
            // Guest checkout - validate required fields
            validateGuestOrder(request);
            order = buildGuestOrder(request);
            // Áp dụng voucher cho khách
            applyPromotionToOrder(order, request.voucherCode(), null);
        } else {
            // User checkout
            order = buildOrder(request, userId);
            // Áp dụng voucher cho user
            applyPromotionToOrder(order, request.voucherCode(), userId);
        }

        // recalculate final amount after discount
        order.calculateFinalAmount();

        log.info(OrderLogMessages.LOG_ORDER_CALCULATE_PRICING,
                order.getSubtotal(), order.getDiscountAmount(),
                order.getShippingFee(), order.getFinalAmount());

        // Create payment
        PaymentMethodEnum method = request.paymentMethod();
        PaymentStatusEnum paymentStatus = PaymentStatusEnum.PENDING;

        Payment payment = Payment.builder()
                .amount(order.getFinalAmount())
                .paymentMethod(method)
                .status(paymentStatus)
                .notes(method == PaymentMethodEnum.CASH
                        ? (isGuest ? OrderMessages.MESSAGE_NOTE_GUEST_COD : OrderMessages.MESSAGE_NOTE_PAYMENT_CASH)
                        : OrderMessages.MESSAGE_NOTE_ONLINE_PENDING)
                .build();
        order.addPayment(payment);

        Order savedOrder = orderRepositoryPort.save(order);

        // Record promotion usage if applicable
        if (order.getVoucherCode() != null && !order.getVoucherCode().isBlank()) {
            try {
                Promotion promotion = promotionService.getByCode(order.getVoucherCode());
                if (promotion != null) {
                    if (userId != null) {
                        promotionUsageService.recordUsage(userId, promotion.getId());
                    } else {
                        // For guest, we just increment the promotion's usage count
                        promotion.incrementUsageCount();
                        promotionService.save(promotion);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to record promotion usage: {}", e.getMessage());
            }
        }

        // Clear cart only for logged-in users
        if (!isGuest) {
            cartService.clearCart();
            log.info(OrderLogMessages.LOG_ORDER_CART_CLEARED, userId);
        }

        log.info("Order created successfully: id={}, code={}, isGuest={}",
                savedOrder.getId(), savedOrder.getOrderCode(), isGuest);

        // Send order confirmation email
        emailServicePort.sendOrderConfirmation(savedOrder);

        return orderMapper.toResponse(savedOrder);
    }

    private void validateGuestOrder(OrderRequest request) {
        if (request.guestEmail() == null || request.guestEmail().isBlank()) {
            throw new IllegalArgumentException(OrderMessages.MESSAGE_GUEST_EMAIL_REQUIRED);
        }
        if (request.receiverName() == null || request.receiverName().isBlank()) {
            throw new IllegalArgumentException(OrderMessages.MESSAGE_RECEIVER_NAME_REQUIRED);
        }
        if (request.receiverPhone() == null || request.receiverPhone().isBlank()) {
            throw new IllegalArgumentException(OrderMessages.MESSAGE_RECEIVER_PHONE_REQUIRED);
        }
        if (request.shippingAddress() == null || request.shippingAddress().isBlank()) {
            throw new IllegalArgumentException(OrderMessages.MESSAGE_SHIPPING_ADDRESS_REQUIRED);
        }

        // Check if email already exists as a member
        if (userService.existsByEmail(request.guestEmail())) {
            throw new IllegalArgumentException(OrderMessages.MESSAGE_GUEST_EMAIL_EXISTS);
        }

        // Validate OTP
        otpService.verifyGuestOtp(request.guestEmail(), request.otpCode());
    }

    private Order buildGuestOrder(OrderRequest request) {
        Order order = Order.builder()
                .user(null) // Guest order không có user
                .userAddress(null) // Guest không có địa chỉ đã lưu
                .status(OrderStatusEnum.PENDING)
                .orderType(OrderTypeEnum.ONLINE)
                .shippingName(request.receiverName())
                .shippingPhone(request.receiverPhone())
                .shippingAddress(request.shippingAddress())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .guestEmail(request.guestEmail())
                .notes(request.note())
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .build();

        order.generateAndSetOrderCode();
        createOrderItems(order, request.items());
        order.calculateFinalAmount();

        return order;
    }

    @Override
    public OrderResponse getGuestOrderByCodeAndEmail(String orderCode, String email) {
        log.info("Looking up guest order: code={}, email={}", orderCode, email);

        Order order = orderRepositoryPort.findByOrderCodeAndGuestEmail(orderCode, email)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        OrderMessages.MESSAGE_GUEST_ORDER_NOT_FOUND));

        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional
    public void updateManualShippingFee(UUID orderId, BigDecimal finalFee) {
        log.info("Updating manual shipping fee for order: {} with fee: {}", orderId, finalFee);

        Order order = getById(orderId);
        OrderStatusEnum oldStatus = order.getStatus();

        // Cập nhật phí ship
        order.setShippingFee(finalFee);

        // Tính toán lại tổng tiền
        order.calculateFinalAmount();

        // Chuyển trạng thái sang ĐÃ XÁC NHẬN nếu đang là PENDING
        if (order.getStatus() == OrderStatusEnum.PENDING) {
            order.setStatus(OrderStatusEnum.CONFIRMED);
        }

        // Nếu có payment CASH, cũng cần update lại amount của payment (hoặc tạo mới nếu
        // chưa có)
        if (order.getPayments() != null && !order.getPayments().isEmpty()) {
            // Giả sử payment đầu tiên là payment chính
            Payment mainPayment = order.getPayments().getFirst();
            if (mainPayment.getPaymentMethod() == PaymentMethodEnum.CASH
                    && mainPayment.getStatus() == PaymentStatusEnum.PENDING) {
                mainPayment.setAmount(order.getFinalAmount());
            }
        }

        Order savedOrder = orderRepositoryPort.save(order);
        log.info(fpt.teddypet.application.constants.shipping.ShippingMessages.SHIPPING_FEE_UPDATED + " OrderId: {}",
                savedOrder.getId());

        // Send email if order is confirmed for the first time
        if (oldStatus == OrderStatusEnum.PENDING && savedOrder.getStatus() == OrderStatusEnum.CONFIRMED) {
            emailServicePort.sendOrderConfirmation(savedOrder);
        }
    }

    @Override
    @Transactional
    public void confirmReceived(UUID orderId) {
        log.info("Customer confirming receipt for order: {}", orderId);
        Order order = getById(orderId);

        // Khách hàng chỉ có thể xác nhận nhận hàng khi Admin đã chuyển sang DELIVERED
        if (order.getStatus() != OrderStatusEnum.DELIVERED) {
            throw new IllegalStateException(OrderMessages.MESSAGE_ERROR_RECEIPT_NOT_ALLOWED);
        }

        order.setStatus(OrderStatusEnum.COMPLETED);
        order.setCompletedAt(java.time.LocalDateTime.now());
        orderRepositoryPort.save(order);
        // feedbackService.sendFeedbackEmailsForOrder(orderId);
    }

    private void sendOrderStatusEmail(Order order) {
        try {
            // Tất cả trạng thái đơn hàng hiện đã được xử lý tập trung bằng Thymeleaf qua
            // sendOrderConfirmation
            emailServicePort.sendOrderConfirmation(order);
        } catch (Exception e) {
            log.error("Failed to send order status email for order {}", order.getOrderCode(), e);
        }
    }

    // ========== CANCEL & RETURN ORDER METHODS ==========

    @Override
    @Transactional
    public void cancelOrderByCustomer(UUID orderId, String reason) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        validateOwnership(orderId, currentUserId);

        Order order = getById(orderId);

        // Khách chỉ được hủy khi đơn đang ở trạng thái PENDING
        if (order.getStatus() != OrderStatusEnum.PENDING) {
            throw new IllegalStateException("Bạn chỉ có thể hủy đơn khi đơn hàng đang chờ xác nhận.");
        }

        // Cập nhật thông tin hủy
        order.setStatus(OrderStatusEnum.CANCELLED);
        order.setCancelReason(reason);
        order.setCancelledAt(java.time.LocalDateTime.now());
        order.setCancelledBy(order.getUser() != null ? order.getUser().getUsername() : "Khách hàng");

        // Hoàn lại stock
        returnOrderStock(order);

        // Cập nhật trạng thái payment
        if (order.getPayments() != null) {
            for (Payment payment : order.getPayments()) {
                if (payment.getStatus() == PaymentStatusEnum.PENDING) {
                    payment.setStatus(PaymentStatusEnum.VOIDED);
                    payment.setNotes(OrderMessages.MESSAGE_NOTE_CANCEL_BY_CUSTOMER);
                } else if (payment.getStatus() == PaymentStatusEnum.COMPLETED) {
                    payment.setStatus(PaymentStatusEnum.REFUND_PENDING);
                    payment.setNotes(OrderMessages.MESSAGE_NOTE_CANCEL_REFUND_PENDING);
                }
            }
        }

        orderRepositoryPort.save(order);
        log.info("Customer cancelled order: {} with reason: {}", orderId, reason);

        // Gửi email thông báo
        sendOrderStatusEmail(order);
    }

    @Override
    @Transactional
    public void cancelOrderByAdmin(UUID orderId, String reason, String adminUsername) {
        Order order = getById(orderId);

        // Admin chỉ được hủy khi đơn ở trạng thái PENDING, CONFIRMED hoặc PROCESSING
        if (order.getStatus() != OrderStatusEnum.PENDING
                && order.getStatus() != OrderStatusEnum.CONFIRMED
                && order.getStatus() != OrderStatusEnum.PROCESSING) {
            throw new IllegalStateException(OrderMessages.MESSAGE_ERROR_CANCEL_INVALID_STATUS);
        }

        // Cập nhật thông tin hủy
        order.setStatus(OrderStatusEnum.CANCELLED);
        order.setCancelReason(reason);
        order.setCancelledAt(java.time.LocalDateTime.now());
        order.setCancelledBy(adminUsername);

        // Hoàn lại stock
        returnOrderStock(order);

        // Cập nhật trạng thái payment
        if (order.getPayments() != null) {
            for (Payment payment : order.getPayments()) {
                if (payment.getStatus() == PaymentStatusEnum.PENDING) {
                    payment.setStatus(PaymentStatusEnum.VOIDED);
                    payment.setNotes(OrderMessages.MESSAGE_NOTE_CANCEL_BY_ADMIN);
                } else if (payment.getStatus() == PaymentStatusEnum.COMPLETED) {
                    payment.setStatus(PaymentStatusEnum.REFUND_PENDING);
                    payment.setNotes(OrderMessages.MESSAGE_NOTE_CANCEL_ADMIN_REFUND);
                }
            }
        }

        orderRepositoryPort.save(order);
        log.info("Admin {} cancelled order: {} with reason: {}", adminUsername, orderId, reason);

        // Gửi email thông báo
        sendOrderStatusEmail(order);
    }

    @Override
    @Transactional
    public void returnOrder(UUID orderId, String reason, String adminUsername) {
        Order order = getById(orderId);

        // Chỉ có thể hoàn trả khi đơn ở trạng thái DELIVERING hoặc DELIVERED (khách
        // boom hoặc trả hàng)
        if (order.getStatus() != OrderStatusEnum.DELIVERING && order.getStatus() != OrderStatusEnum.DELIVERED) {
            throw new IllegalStateException(OrderMessages.MESSAGE_ERROR_RETURN_INVALID_STATUS);
        }

        // Cập nhật thông tin hoàn trả
        order.setStatus(OrderStatusEnum.RETURNED);
        order.setCancelReason(reason);
        order.setCancelledAt(java.time.LocalDateTime.now());
        order.setCancelledBy(adminUsername);

        // Hoàn lại stock
        returnOrderStock(order);

        // Cập nhật trạng thái payment
        if (order.getPayments() != null) {
            for (Payment payment : order.getPayments()) {
                if (payment.getStatus() == PaymentStatusEnum.PENDING) {
                    payment.setStatus(PaymentStatusEnum.VOIDED);
                    payment.setNotes(OrderMessages.MESSAGE_NOTE_RETURN_VOIDED);
                } else if (payment.getStatus() == PaymentStatusEnum.COMPLETED) {
                    payment.setStatus(PaymentStatusEnum.REFUND_PENDING);
                    payment.setNotes(OrderMessages.MESSAGE_NOTE_RETURN_REFUND);
                }
            }
        }

        orderRepositoryPort.save(order);
        log.info("Admin {} returned order: {} with reason: {}", adminUsername, orderId, reason);

        // Gửi email thông báo
        sendReturnOrderEmail(order);
    }

    private void sendReturnOrderEmail(Order order) {
        try {
            // Tất cả trạng thái đơn hàng (bao gồm RETURNED) hiện đã được xử lý tập trung
            // bằng Thymeleaf
            emailServicePort.sendOrderConfirmation(order);
        } catch (Exception e) {
            log.error("Failed to send return order email for order {}", order.getOrderCode(), e);
        }
    }

    @Override
    @Transactional
    public void requestReturnByCustomer(UUID orderId, ReturnOrderRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        validateOwnership(orderId, currentUserId);

        Order order = getById(orderId);

        // Chỉ được trả khi trạng thái là COMPLETED
        if (order.getStatus() != OrderStatusEnum.COMPLETED) {
            throw new IllegalStateException("Bạn chỉ có thể yêu cầu trả hàng khi đơn hàng đã hoàn thành.");
        }

        // Kiểm tra thời hạn (4 ngày)
        if (order.getCompletedAt() != null) {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            if (now.isAfter(order.getCompletedAt().plusDays(4))) {
                throw new IllegalStateException("Đã quá thời hạn 4 ngày cho phép trả hàng.");
            }
        }

        order.setStatus(OrderStatusEnum.RETURN_REQUESTED);
        order.setReturnReason(request.reason());
        order.setReturnRequestedAt(java.time.LocalDateTime.now());

        if (request.evidenceUrls() != null && !request.evidenceUrls().isEmpty()) {
            order.setReturnEvidence(String.join(",", request.evidenceUrls()));
        }

        orderRepositoryPort.save(order);
        log.info("Customer requested return for order: {}. Reason: {}", orderId, request.reason());

        // Gửi email thông báo cho Admin/Customer
        sendOrderStatusEmail(order);
    }

    @Override
    @Transactional
    public void handleReturnRequestByAdmin(UUID orderId, AdminHandleReturnRequest request, String adminUsername) {
        Order order = getById(orderId);

        if (order.getStatus() != OrderStatusEnum.RETURN_REQUESTED) {
            throw new IllegalStateException("Đơn hàng này không ở trong trạng thái yêu cầu trả hàng.");
        }

        order.setAdminReturnNote(request.adminNote());

        if (request.approved()) {
            // Đồng ý trả -> RETURNED
            order.setStatus(OrderStatusEnum.RETURNED);
            order.setCancelledAt(java.time.LocalDateTime.now());
            order.setCancelledBy(adminUsername);

            // Hoàn kho (Lệnh nhập kho lại)
            returnOrderStock(order);

            // Hoàn tiền hoặc xử lý payment
            if (order.getPayments() != null) {
                for (Payment payment : order.getPayments()) {
                    if (payment.getStatus() == PaymentStatusEnum.COMPLETED) {
                        payment.setStatus(PaymentStatusEnum.REFUND_PENDING);
                        payment.setNotes("Hoàn tiền sau khi duyệt trả hàng bởi " + adminUsername);
                    }
                }
            }
            log.info("Admin {} APPROVED return request for order: {}", adminUsername, orderId);
        } else {
            // Từ chối -> Quay lại COMPLETED
            order.setStatus(OrderStatusEnum.COMPLETED);
            log.info("Admin {} REJECTED return request for order: {}. Note: {}", adminUsername, orderId,
                    request.adminNote());
        }

        orderRepositoryPort.save(order);

        // Gửi thông báo email
        sendOrderStatusEmail(order);
    }

}
