package fpt.teddypet.presentation.controller.orders;
import fpt.teddypet.application.constants.orders.order.OrderMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.request.orders.order.OrderRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderSearchRequest;
import fpt.teddypet.application.dto.response.orders.order.OrderResponse;
import fpt.teddypet.application.port.input.orders.order.OrderService;
import fpt.teddypet.application.util.SecurityUtil;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiConstants.API_ORDER)
@Tag(name = "Đơn hàng", description = "API quản lý đơn hàng")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ========== USER ENDPOINTS ==========
    
    @GetMapping("/my-orders")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy đơn hàng của tôi (phân trang)", description = "Lấy danh sách đơn hàng của user hiện tại với phân trang")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortKey,
            @RequestParam(required = false) String sortDirection) {
        OrderSearchRequest request = new OrderSearchRequest(page, size, null, sortKey, sortDirection);
        PageResponse<OrderResponse> orders = orderService.getMyOrders(request);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/my-orders/list")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy tất cả đơn hàng của tôi", description = "Lấy danh sách tất cả đơn hàng của user hiện tại (không phân trang)")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrdersList() {
        List<OrderResponse> orders = orderService.getMyOrdersList();
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/my-orders/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy đơn hàng của tôi theo ID", description = "Lấy chi tiết đơn hàng của user hiện tại theo ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getMyOrderById(@PathVariable UUID id) {
        OrderResponse order = orderService.getMyOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/my-orders/code/{code}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy đơn hàng của tôi theo mã", description = "Lấy chi tiết đơn hàng của user hiện tại theo mã đơn hàng")
    public ResponseEntity<ApiResponse<OrderResponse>> getMyOrderByCode(@PathVariable String code) {
        OrderResponse order = orderService.getMyOrderByCode(code);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Hủy đơn hàng", description = "Hủy đơn hàng của user hiện tại")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(@PathVariable UUID id) {
        orderService.cancelOrder(id);
        return ResponseEntity.ok(ApiResponse.success(OrderMessages.MESSAGE_ORDER_CANCELLED_SUCCESS));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tạo đơn hàng", description = "Tạo đơn hàng mới từ thông tin sản phẩm")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody OrderRequest request) {
        UUID userId = SecurityUtil.getCurrentUserId();
        OrderResponse order = orderService.createOrder(request, userId);
        return ResponseEntity.ok(ApiResponse.success(OrderMessages.MESSAGE_ORDER_CREATED_SUCCESS, order));
    }

    // ========== STAFF/ADMIN ENDPOINTS ==========
    
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Lấy tất cả đơn hàng (phân trang)", description = "Lấy danh sách tất cả đơn hàng với phân trang (Staff/Admin)")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortKey,
            @RequestParam(required = false) String sortDirection) {
        OrderSearchRequest request = new OrderSearchRequest(page, size, null, sortKey, sortDirection);
        PageResponse<OrderResponse> orders = orderService.getAllOrders(request);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Lấy đơn hàng theo ID", description = "Lấy chi tiết đơn hàng theo ID (Staff/Admin)")
    public ResponseEntity<ApiResponse<OrderResponse>> getById(@PathVariable UUID id) {
        OrderResponse order = orderService.getByIdResponse(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Lấy đơn hàng theo mã", description = "Lấy chi tiết đơn hàng theo mã (Staff/Admin)")
    public ResponseEntity<ApiResponse<OrderResponse>> getByCode(@PathVariable String code) {
        OrderResponse order = orderService.getByOrderCodeResponse(code);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Tìm kiếm đơn hàng", description = "Tìm kiếm đơn hàng theo mã, tên, số điện thoại (Staff/Admin)")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> searchOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortKey,
            @RequestParam(required = false) String sortDirection) {
        OrderSearchRequest request = new OrderSearchRequest(page, size, keyword, sortKey, sortDirection);
        PageResponse<OrderResponse> orders = orderService.searchOrders(request);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Lấy đơn hàng theo trạng thái", description = "Lấy danh sách đơn hàng theo trạng thái (Staff/Admin)")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getByStatus(
            @PathVariable OrderStatusEnum status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortKey,
            @RequestParam(required = false) String sortDirection) {
        OrderSearchRequest request = new OrderSearchRequest(page, size, null, sortKey, sortDirection);
        PageResponse<OrderResponse> orders = orderService.getOrdersByStatus(status, request);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Cập nhật trạng thái đơn hàng", description = "Cập nhật trạng thái đơn hàng (Staff/Admin)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam OrderStatusEnum status) {
        OrderResponse order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(OrderMessages.MESSAGE_ORDER_STATUS_UPDATED_SUCCESS, order));
    }
}
