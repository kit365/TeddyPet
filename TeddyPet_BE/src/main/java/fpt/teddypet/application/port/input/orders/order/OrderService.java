package fpt.teddypet.application.port.input.orders.order;

import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.request.orders.order.AdminHandleReturnRequest;
import fpt.teddypet.application.dto.request.orders.order.AdminHandleOrderRefundRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderSearchRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderRefundRequest;
import fpt.teddypet.application.dto.request.orders.order.ReturnOrderRequest;
import fpt.teddypet.application.dto.response.orders.order.OrderResponse;
import fpt.teddypet.application.dto.response.orders.order.OrderRefundResponse;

import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;

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

    // Admin manual shipping fee update
    void updateManualShippingFee(UUID orderId, java.math.BigDecimal finalFee);

    // Customer confirm receipt
    void confirmReceived(UUID orderId);

    // Cancel order by customer (PENDING or CONFIRMED/PROCESSING when paid - hủy & hoàn tiền)
    void cancelOrderByCustomer(UUID orderId, String reason);

    // Cancel order by guest (no auth): orderCode + email + reason
    void cancelOrderByGuest(String orderCode, String email, String reason);

    // Cancel order by admin (PENDING or CONFIRMED status allowed)
    void cancelOrderByAdmin(UUID orderId, String reason, String adminUsername);

    // Return order (for DELIVERING or DELIVERED status - customer boom or return)
    void returnOrder(UUID orderId, String reason, String adminUsername);

    // Customer requests return (after COMPLETED status)
    void requestReturnByCustomer(UUID orderId, ReturnOrderRequest request);

    // Admin handles return requested by customer
    void handleReturnRequestByAdmin(UUID orderId, AdminHandleReturnRequest request, String adminUsername);

    /**
     * Admin/Staff đổi phương thức thanh toán của đơn tại quầy (chỉ khi đơn đang CONFIRMED, Chờ thanh toán).
     */
    void updatePaymentMethod(UUID orderId, PaymentMethodEnum paymentMethod);

    /**
     * Admin/Staff xác nhận đã thanh toán cho đơn online (chuyển khoản) – đơn CONFIRMED, payment PENDING → COMPLETED.
     */
    void confirmPaymentByAdmin(UUID orderId);

    /**
     * Cập nhật thông tin liên hệ của đơn (email khách/guestEmail, địa chỉ giao hàng).
     */
    void updateOrderContactInfo(UUID orderId, String shippingAddress, String guestEmail);

    /** Khách hàng/guest gửi yêu cầu hoàn tiền cho 1 đơn (public). */
    OrderRefundResponse createOrderRefundRequest(UUID orderId, OrderRefundRequest request);

    /** Admin/Staff duyệt hoặc từ chối yêu cầu hoàn tiền. */
    OrderRefundResponse handleOrderRefundRequest(UUID orderId, Long refundId, AdminHandleOrderRefundRequest request, String adminUsername);

    /** Khách hàng cập nhật yêu cầu hoàn tiền khi admin yêu cầu (ACTION_REQUIRED). */
    OrderRefundResponse updateOrderRefundRequest(UUID orderId, Long refundId, OrderRefundRequest request);

    /** Lấy danh sách yêu cầu hoàn tiền của đơn (theo thứ tự mới nhất trước). */
    List<OrderRefundResponse> getOrderRefundRequests(UUID orderId);
}
