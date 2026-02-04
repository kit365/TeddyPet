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
import fpt.teddypet.application.port.input.orders.cart.CartService;
import fpt.teddypet.application.port.input.orders.order.OrderItemService;
import fpt.teddypet.application.port.input.orders.order.OrderService;
import fpt.teddypet.application.port.input.products.ProductVariantService;
import fpt.teddypet.application.port.input.user.UserAddressService;
import fpt.teddypet.application.port.output.orders.order.OrderRepositoryPort;
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
                    "Online payment methods are not yet implemented. Please use CASH payment.");
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
                .notes("Thanh toán tiền mặt khi nhận hàng")
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
                throw new IllegalArgumentException("Địa chỉ giao hàng không được để trống");
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
                throw new IllegalArgumentException("Số điện thoại người nhận không được để trống");
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

        Order savedOrder = orderRepositoryPort.save(order);
        log.info(OrderLogMessages.LOG_ORDER_STATUS_UPDATE, orderId, oldStatus, status);
    }

    @Override
    public OrderResponse getByIdResponse(UUID orderId) {
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_ID, orderId);
        Order order = getById(orderId);
        return orderMapper.toResponse(order);
    }

    @Override
    public OrderResponse getByOrderCodeResponse(String orderCode) {
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_CODE, orderCode);
        Order order = getByOrderCode(orderCode);
        return orderMapper.toResponse(order);
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
        return PageResponse.fromPage(orders.map(orderMapper::toResponse));
    }

    @Override
    public PageResponse<OrderResponse> getOrdersByStatus(OrderStatusEnum status, OrderSearchRequest request) {
        Pageable pageable = buildPageable(request);
        Page<Order> orders = orderRepositoryPort.findByStatus(status, pageable);
        return PageResponse.fromPage(orders.map(orderMapper::toResponse));
    }

    @Override
    public PageResponse<OrderResponse> searchOrders(OrderSearchRequest request) {
        Pageable pageable = buildPageable(request);
        String keyword = request.keyword() != null ? request.keyword() : "";
        Page<Order> orders = orderRepositoryPort.searchOrders(keyword, pageable);
        return PageResponse.fromPage(orders.map(orderMapper::toResponse));
    }

    @Override
    public PageResponse<OrderResponse> getMyOrders(OrderSearchRequest request) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Pageable pageable = buildPageable(request);
        Page<Order> orders = orderRepositoryPort.findByUserId(currentUserId, pageable);
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_USER, currentUserId, orders.getTotalElements());
        return PageResponse.fromPage(orders.map(orderMapper::toResponse));
    }

    @Override
    public List<OrderResponse> getMyOrdersList() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        List<Order> orders = orderRepositoryPort.findByUserId(currentUserId);
        log.info(OrderLogMessages.LOG_ORDER_GET_BY_USER, currentUserId, orders.size());
        return orders.stream()
                .map(orderMapper::toResponse)
                .toList();
    }

    @Override
    public OrderResponse getMyOrderById(UUID orderId) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Order order = getById(orderId);
        validateOwnership(orderId, currentUserId);
        return orderMapper.toResponse(order);
    }

    @Override
    public OrderResponse getMyOrderByCode(String orderCode) {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        Order order = getByOrderCode(orderCode);
        validateOwnership(order.getId(), currentUserId);
        return orderMapper.toResponse(order);
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

            // Guest chỉ hỗ trợ COD
            if (request.paymentMethod() != PaymentMethodEnum.CASH) {
                throw new UnsupportedOperationException(OrderMessages.MESSAGE_GUEST_PAYMENT_COD_ONLY);
            }
        } else {
            // User checkout
            order = buildOrder(request, userId);
        }

        log.info(OrderLogMessages.LOG_ORDER_CALCULATE_PRICING,
                order.getSubtotal(), order.getDiscountAmount(),
                order.getShippingFee(), order.getFinalAmount());

        // Create payment
        // Create payment
        if (request.paymentMethod() == PaymentMethodEnum.CASH) {
            Payment payment = Payment.builder()
                    .amount(order.getFinalAmount())
                    .paymentMethod(PaymentMethodEnum.CASH)
                    .status(PaymentStatusEnum.PENDING)
                    .notes(isGuest ? "Đơn hàng khách vãng lai - COD" : "Thanh toán tiền mặt khi nhận hàng")
                    .build();
            order.addPayment(payment);
        } else {
            throw new UnsupportedOperationException(
                    "Online payment methods are not yet implemented. Please use CASH payment.");
        }

        Order savedOrder = orderRepositoryPort.save(order);

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

}
