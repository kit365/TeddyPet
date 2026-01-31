package fpt.teddypet.application.port.input.orders.order;

import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.request.orders.order.OrderRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderSearchRequest;
import fpt.teddypet.application.dto.response.orders.order.OrderResponse;

import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;

import java.util.List;
import java.util.UUID;

public interface OrderService {

    void createOrder(OrderRequest request, UUID userId);

    void updateOrderStatus(UUID orderId, OrderStatusEnum status);

    OrderResponse getByIdResponse(UUID orderId);

    OrderResponse getByOrderCodeResponse(String orderCode);

    Order getById(UUID orderId);

    Order getByOrderCode(String orderCode);

    PageResponse<OrderResponse> getAllOrders(OrderSearchRequest request);

    PageResponse<OrderResponse> getOrdersByStatus(OrderStatusEnum status, OrderSearchRequest request);

    PageResponse<OrderResponse> searchOrders(OrderSearchRequest request);

    PageResponse<OrderResponse> getMyOrders(OrderSearchRequest request);

    List<OrderResponse> getMyOrdersList();

    OrderResponse getMyOrderById(UUID orderId);

    OrderResponse getMyOrderByCode(String orderCode);

    void validateOwnership(UUID orderId, UUID userId);

    boolean isOwner(UUID orderId, UUID userId);

    void cancelOrder(UUID orderId);

    // Unified order creation - works for both user and guest
    // If userId is null, treat as guest order
    OrderResponse createUnifiedOrder(OrderRequest request, UUID userId);

    // Guest order lookup
    OrderResponse getGuestOrderByCodeAndEmail(String orderCode, String email);
}
