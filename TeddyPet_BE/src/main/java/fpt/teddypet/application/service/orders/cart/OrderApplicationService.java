package fpt.teddypet.application.service.orders.cart;

import fpt.teddypet.application.constants.orders.order.OrderLogMessages;
import fpt.teddypet.application.port.input.auth.OtpService;
import fpt.teddypet.application.constants.orders.order.OrderMessages;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.common.SortDirection;
import fpt.teddypet.application.dto.request.orders.order.OrderItemRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderSearchRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderSortField;
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
import fpt.teddypet.application.constants.email.EmailTemplates;
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

        BigDecimal discount = BigDecimal.ZERO;
        if (promotion.getDiscountType() == fpt.teddypet.domain.enums.promotions.DiscountTypeEnum.PERCENTAGE) {
            discount = order.getSubtotal().multiply(promotion.getDiscountValue()).divide(BigDecimal.valueOf(100));
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

    private static final String APP_NAME = "TeddyPet";
    // TODO: Move to config
    private static final String FRONTEND_URL = "http://localhost:5173";

    private OrderResponse toEnhancedResponse(Order order) {
        OrderResponse response = orderMapper.toResponse(order);
        Double distance = calculateDistanceKm(order);

        return new OrderResponse(
                response.id(),
                response.orderCode(),
                response.user(),
                response.userAddressId(),
                response.guestEmail(),
                response.subtotal(),
                response.shippingFee(),
                response.discountAmount(),
                response.voucherCode(),
                response.finalAmount(),
                response.orderType(),
                response.status(),
                response.shippingAddress(),
                response.shippingPhone(),
                response.shippingName(),
                response.notes(),
                response.orderItems(),
                response.payments(),
                distance,
                response.createdAt(),
                response.updatedAt());
    }

    private Double calculateDistanceKm(Order order) {
        Double destLat = null;
        Double destLng = null;

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

        // Return stock if moving to CANCELLED
        if (status == OrderStatusEnum.CANCELLED && oldStatus != OrderStatusEnum.CANCELLED) {
            returnOrderStock(order);
        }

        Order savedOrder = orderRepositoryPort.save(order);
        log.info(OrderLogMessages.LOG_ORDER_STATUS_UPDATE, orderId, oldStatus, status);

        // Send email notification
        sendOrderStatusEmail(savedOrder, status);

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
    public OrderResponse getByIdResponse(UUID orderId) {
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_ID, orderId);
        Order order = getById(orderId);
        return toEnhancedResponse(order);
    }

    @Override
    public OrderResponse getByOrderCodeResponse(String orderCode) {
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_CODE, orderCode);
        Order order = getByOrderCode(orderCode);
        return toEnhancedResponse(order);
    }

    @Override
    public Order getById(UUID orderId) {
        return orderRepositoryPort.findById(orderId);
    }

    @Override
    public Order getByOrderCode(String orderCode) {
        return orderRepositoryPort.findByOrderCode(orderCode);
    }

    @Override
    public PageResponse<OrderResponse> getAllOrders(OrderSearchRequest request) {
        Pageable pageable = buildPageable(request);
        Page<Order> orders = orderRepositoryPort.findAll(pageable);
        log.info(OrderLogMessages.LOG_ORDER_GET_ALL, orders.getTotalElements());
        return PageResponse.fromPage(orders.map(this::toEnhancedResponse));
    }

    @Override
    public PageResponse<OrderResponse> getOrdersByStatus(OrderStatusEnum status, OrderSearchRequest request) {
        Pageable pageable = buildPageable(request);
        Page<Order> orders = orderRepositoryPort.findByStatus(status, pageable);
        return PageResponse.fromPage(orders.map(this::toEnhancedResponse));
    }

    @Override
    public PageResponse<OrderResponse> searchOrders(OrderSearchRequest request) {
        Pageable pageable = buildPageable(request);
        String keyword = request.keyword() != null ? request.keyword() : "";
        Page<Order> orders = orderRepositoryPort.searchOrders(keyword, pageable);
        return PageResponse.fromPage(orders.map(this::toEnhancedResponse));
    }

    @Override
    public PageResponse<OrderResponse> getMyOrders(OrderSearchRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Pageable pageable = buildPageable(request);
        Page<Order> orders = orderRepositoryPort.findByUserId(currentUserId, pageable);
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_USER, currentUserId, orders.getTotalElements());
        return PageResponse.fromPage(orders.map(this::toEnhancedResponse));
    }

    @Override
    public List<OrderResponse> getMyOrdersList() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        List<Order> orders = orderRepositoryPort.findByUserId(currentUserId);
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_USER, currentUserId, orders.size());
        return orders.stream()
                .map(this::toEnhancedResponse)
                .toList();
    }

    @Override
    public OrderResponse getMyOrderById(UUID orderId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Order order = getById(orderId);
        validateOwnership(orderId, currentUserId);
        return toEnhancedResponse(order);
    }

    @Override
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
                        : "Thanh toán Online - Đang chờ xử lý")
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
            Payment mainPayment = order.getPayments().get(0);
            if (mainPayment.getPaymentMethod() == PaymentMethodEnum.CASH
                    && mainPayment.getStatus() == PaymentStatusEnum.PENDING) {
                mainPayment.setAmount(order.getFinalAmount());
            }
        }

        Order savedOrder = orderRepositoryPort.save(order);
        log.info(fpt.teddypet.application.constants.shipping.ShippingMessages.SHIPPING_FEE_UPDATED + " OrderId: {}",
                savedOrder.getId());

        // Send email if order is confirmed
        if (savedOrder.getStatus() == OrderStatusEnum.CONFIRMED) {
            sendOrderStatusEmail(savedOrder, OrderStatusEnum.CONFIRMED);
        }
    }

    @Override
    @Transactional
    public void confirmReceived(UUID orderId) {
        log.info("Customer confirming receipt for order: {}", orderId);
        Order order = getById(orderId);

        // Khách hàng chỉ có thể xác nhận nhận hàng khi Admin đã chuyển sang DELIVERED
        if (order.getStatus() != OrderStatusEnum.DELIVERED) {
            throw new IllegalStateException(
                    "Đơn hàng phải ở trạng thái Đã giao hàng mới có thể xác nhận nhận hàng.");
        }

        order.setStatus(OrderStatusEnum.COMPLETED);
        orderRepositoryPort.save(order);

        sendOrderStatusEmail(order, OrderStatusEnum.COMPLETED);

        // Send feedback email
        feedbackService.sendFeedbackEmailsForOrder(orderId);
    }

    private void sendOrderStatusEmail(Order order, OrderStatusEnum status) {
        try {
            String email = order.getGuestEmail();
            if (email == null && order.getUser() != null) {
                email = order.getUser().getEmail();
            }

            if (email == null) {
                log.warn("Cannot send email: No email found for order {}", order.getId());
                return;
            }

            String statusText;
            String message;

            switch (status) {
                case CONFIRMED -> {
                    statusText = "ĐÃ XÁC NHẬN";
                    message = "Đơn hàng của bạn đã được xác nhận phí vận chuyển và đang được chuẩn bị.";
                }
                case PROCESSING -> {
                    statusText = "ĐANG ĐÓNG GÓI";
                    message = "Đơn hàng của bạn đang được đóng gói và chuẩn bị giao.";
                }
                case DELIVERING -> {
                    statusText = "ĐANG GIAO HÀNG";
                    message = "Shipper đang giao hàng tới bạn. Vui lòng chú ý địa chỉ và điện thoại để nhận hàng nhé!";
                }
                case DELIVERED -> {
                    statusText = "GIAO HÀNG THÀNH CÔNG";
                    message = "Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua sắm tại TeddyPet!";
                }
                case COMPLETED -> {
                    statusText = "ĐÃ HOÀN TẤT";
                    message = "Đơn hàng đã hoàn tất. Hẹn gặp lại bạn lần sau!";
                }
                case CANCELLED -> {
                    statusText = "ĐÃ HỦY";
                    message = "Đơn hàng đã bị hủy. Vui lòng liên hệ CSKH nếu có thắc mắc.";
                }
                default -> {
                    return; // Ignore other statuses
                }
            }

            String orderLink = FRONTEND_URL + "/tracking?code=" + order.getOrderCode(); // Guest tracking link
            if (order.getUser() != null) {
                orderLink = FRONTEND_URL + "/account/orders/" + order.getId();
            }

            String subject = String.format(EmailTemplates.SUBJECT_ORDER_STATUS_UPDATE, APP_NAME, order.getOrderCode());
            String body = String.format(EmailTemplates.BODY_ORDER_STATUS_UPDATE,
                    APP_NAME,
                    order.getOrderCode(),
                    order.getShippingName(),
                    order.getOrderCode(),
                    statusText,
                    message,
                    orderLink,
                    APP_NAME,
                    APP_NAME);

            emailServicePort.sendHtmlEmail(email, subject, body);
            log.info("Sent status update email to {}", email);

        } catch (Exception e) {
            log.error("Failed to send order status email", e);
            // Don't throw exception to avoid rolling back transaction
        }
    }

}
