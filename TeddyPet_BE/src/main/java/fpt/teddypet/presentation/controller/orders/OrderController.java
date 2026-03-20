package fpt.teddypet.presentation.controller.orders;

import fpt.teddypet.application.constants.orders.order.OrderMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.request.orders.order.AdminHandleReturnRequest;
import fpt.teddypet.application.dto.request.orders.order.CancelOrderRequest;
import fpt.teddypet.application.dto.request.orders.order.GuestCancelOrderRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderRequest;
import fpt.teddypet.application.dto.request.orders.order.ReturnOrderRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderSearchRequest;
import fpt.teddypet.application.dto.request.orders.order.UpdateOrderContactRequest;
import fpt.teddypet.application.dto.request.orders.order.OrderRefundRequest;
import fpt.teddypet.application.dto.request.orders.order.AdminHandleOrderRefundRequest;
import fpt.teddypet.application.dto.response.orders.order.OrderResponse;
import fpt.teddypet.application.dto.response.orders.order.OrderRefundResponse;
import fpt.teddypet.application.port.input.orders.order.OrderService;
import fpt.teddypet.application.port.input.pdf.PdfService;
import fpt.teddypet.application.util.SecurityUtil;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import fpt.teddypet.application.service.orders.OrderExcelService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(ApiConstants.API_ORDER)
@Tag(name = "Đơn hàng", description = "API quản lý đơn hàng")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final PdfService pdfService;
    private final OrderExcelService orderExcelService;

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

    @GetMapping("/my-orders/{id}/invoice/pdf")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tải PDF hóa đơn của tôi", description = "Tải tệp PDF hóa đơn cho đơn hàng của tôi")
    public ResponseEntity<byte[]> downloadMyOrderInvoicePdf(@PathVariable UUID id) {
        // validateOwnership ensures that the current user actually owns the order
        orderService.validateOwnership(id, SecurityUtil.getCurrentUserId());
        byte[] pdfBytes = pdfService.generateInvoicePdf(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "invoice-" + id + ".pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
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
    @Operation(summary = "Hủy đơn hàng (Customer)", description = "Khách hàng hủy đơn hàng - chỉ được phép khi đơn đang chờ xác nhận (PENDING)")
    public ResponseEntity<ApiResponse<Void>> cancelOrderByCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody CancelOrderRequest request) {
        orderService.cancelOrderByCustomer(id, request.reason());
        return ResponseEntity.ok(ApiResponse.success(OrderMessages.MESSAGE_ORDER_CANCELLED_SUCCESS));
    }

    @PatchMapping("/{id}/received")
    @Operation(summary = "Xác nhận đã nhận hàng", description = "User xác nhận đã nhận được hàng")
    public ResponseEntity<ApiResponse<Void>> confirmReceived(@PathVariable UUID id) {
        orderService.confirmReceived(id);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận đã nhận hàng thành công."));
    }

    @PostMapping
    @Operation(summary = "Tạo đơn hàng", description = "Tạo đơn hàng mới - hỗ trợ cả user đăng nhập và khách vãng lai")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody OrderRequest request) {
        // Tự động detect: có token = user, không có = guest
        UUID userId = SecurityUtil.getCurrentUserIdOrNull();
        OrderResponse response = orderService.createUnifiedOrder(request, userId);
        return ResponseEntity.ok(ApiResponse.success(OrderMessages.MESSAGE_ORDER_CREATED_SUCCESS, response));
    }

    @PatchMapping("/{id}/contact")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Cập nhật thông tin liên hệ đơn hàng", description = "Admin/Staff cập nhật email khách và/hoặc địa chỉ giao hàng")
    public ResponseEntity<ApiResponse<Void>> updateContactInfo(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderContactRequest request) {
        orderService.updateOrderContactInfo(id, request.shippingAddress(), request.guestEmail());
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật thông tin liên hệ đơn hàng."));
    }

    // ========== GUEST ORDER LOOKUP ==========

    @GetMapping("/track/{code}")
    @Operation(summary = "Tra cứu đơn hàng công khai", description = "Tra cứu đơn hàng bằng mã đơn - không cần email vì orderCode là thông tin bảo mật")
    public ResponseEntity<ApiResponse<OrderResponse>> trackOrder(@PathVariable String code) {
        OrderResponse response = orderService.getByOrderCodeResponse(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/guest/lookup")
    @Operation(summary = "Tra cứu đơn hàng khách vãng lai (legacy)", description = "Tra cứu đơn hàng bằng mã đơn và email - dùng /track/{code} thay thế")
    public ResponseEntity<ApiResponse<OrderResponse>> lookupGuestOrder(
            @RequestParam String orderCode,
            @RequestParam String email) {
        OrderResponse response = orderService.getGuestOrderByCodeAndEmail(orderCode, email);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/guest/cancel")
    @Operation(summary = "Hủy đơn hàng (khách vãng lai)", description = "Khách không đăng nhập hủy đơn bằng mã đơn + email + lý do")
    public ResponseEntity<ApiResponse<Void>> cancelOrderByGuest(@Valid @RequestBody GuestCancelOrderRequest request) {
        orderService.cancelOrderByGuest(request.orderCode(), request.email(), request.reason());
        return ResponseEntity.ok(ApiResponse.success(OrderMessages.MESSAGE_ORDER_CANCELLED_SUCCESS));
    }

    @GetMapping("/{orderId}/refund-requests")
    @Operation(summary = "Lấy danh sách yêu cầu hoàn tiền của đơn (public)", description = "Xem lịch sử các yêu cầu hoàn tiền và phản hồi admin")
    public ResponseEntity<ApiResponse<List<OrderRefundResponse>>> getOrderRefundRequests(@PathVariable UUID orderId) {
        List<OrderRefundResponse> list = orderService.getOrderRefundRequests(orderId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/{id}/refund-requests")
    @Operation(summary = "Gửi yêu cầu hoàn tiền (public)", description = "Khách hàng/khách vãng lai gửi yêu cầu hoàn tiền cho đơn hàng đã thanh toán online")
    public ResponseEntity<ApiResponse<OrderRefundResponse>> createRefundRequest(
            @PathVariable UUID id,
            @Valid @RequestBody OrderRefundRequest request
    ) {
        OrderRefundResponse data = orderService.createOrderRefundRequest(id, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{id}/refund-requests/{refundId}")
    @Operation(summary = "Cập nhật yêu cầu hoàn tiền (public)", description = "Khách hàng cập nhật lại yêu cầu hoàn tiền khi admin yêu cầu")
    public ResponseEntity<ApiResponse<OrderRefundResponse>> updateRefundRequest(
            @PathVariable UUID id,
            @PathVariable Long refundId,
            @Valid @RequestBody OrderRefundRequest request
    ) {
        OrderRefundResponse data = orderService.updateOrderRefundRequest(id, refundId, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // ========== STAFF/ADMIN ENDPOINTS ==========

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Xuất đơn hàng ra Excel", description = "Xuất toàn bộ đơn hàng ra file Excel (Staff/Admin)")
    public void exportOrdersToExcel(HttpServletResponse response) throws java.io.IOException {
        orderExcelService.exportOrdersToExcel(response);
    }

    @PostMapping("/{orderId}/refund-requests/{refundId}/handle")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Duyệt / từ chối yêu cầu hoàn tiền (Staff/Admin)")
    public ResponseEntity<ApiResponse<OrderRefundResponse>> handleRefundRequest(
            @PathVariable UUID orderId,
            @PathVariable Long refundId,
            @Valid @RequestBody AdminHandleOrderRefundRequest request
    ) {
        String adminUsername = SecurityUtil.getCurrentUsername();
        OrderRefundResponse data = orderService.handleOrderRefundRequest(orderId, refundId, request, adminUsername);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

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

    @GetMapping("/{id}/invoice/pdf")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Tải PDF hóa đơn theo ID", description = "Tải tệp PDF hóa đơn cho đơn hàng (Staff/Admin)")
    public ResponseEntity<byte[]> downloadOrderInvoicePdf(@PathVariable UUID id) {
        byte[] pdfBytes = pdfService.generateInvoicePdf(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "invoice-" + id + ".pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
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
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable UUID id,
            @RequestParam OrderStatusEnum status) {
        orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(OrderMessages.MESSAGE_ORDER_STATUS_UPDATED_SUCCESS));
    }

    @PatchMapping("/{id}/payment-method")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Đổi phương thức thanh toán (đơn tại quầy)", description = "Chỉ áp dụng khi đơn đang Chờ thanh toán (CONFIRMED). Cho phép đổi giữa Tiền mặt và Chuyển khoản.")
    public ResponseEntity<ApiResponse<Void>> updatePaymentMethod(
            @PathVariable UUID id,
            @RequestParam PaymentMethodEnum paymentMethod) {
        orderService.updatePaymentMethod(id, paymentMethod);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật phương thức thanh toán."));
    }

    @PatchMapping("/{id}/shipping-fee")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Cập nhật phí vận chuyển thủ công", description = "Nhân viên/Admin cập nhật phí vận chuyển và chốt đơn (PENDING → CONFIRMED)")
    public ResponseEntity<ApiResponse<Void>> updateManualShippingFee(
            @PathVariable UUID id,
            @RequestParam java.math.BigDecimal finalFee) {
        orderService.updateManualShippingFee(id, finalFee);
        return ResponseEntity.ok(
                ApiResponse.success(fpt.teddypet.application.constants.shipping.ShippingMessages.SHIPPING_FEE_UPDATED));
    }

    @PatchMapping("/{id}/admin-cancel")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Hủy đơn hàng (Admin)", description = "Admin/Staff hủy đơn hàng - chỉ được phép khi đơn ở trạng thái PENDING hoặc CONFIRMED")
    public ResponseEntity<ApiResponse<Void>> cancelOrderByAdmin(
            @PathVariable UUID id,
            @Valid @RequestBody CancelOrderRequest request) {
        String adminUsername = SecurityUtil.getCurrentUsername();
        orderService.cancelOrderByAdmin(id, request.reason(), adminUsername);
        return ResponseEntity.ok(ApiResponse.success(OrderMessages.MESSAGE_ORDER_CANCELLED_SUCCESS));
    }

    @PatchMapping("/{id}/confirm-payment")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Xác nhận đã thanh toán (Admin)", description = "Admin/Staff xác nhận đã nhận thanh toán cho đơn online (chuyển khoản) – sau đó mới hiện nút Bắt đầu đóng gói")
    public ResponseEntity<ApiResponse<Void>> confirmPaymentByAdmin(@PathVariable UUID id) {
        orderService.confirmPaymentByAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận thanh toán."));
    }

    @PatchMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Hoàn trả đơn hàng", description = "Admin/Staff đánh dấu đơn hàng hoàn trả - dùng khi khách boom hàng hoặc trả hàng (DELIVERING hoặc DELIVERED)")
    public ResponseEntity<ApiResponse<Void>> returnOrder(
            @PathVariable UUID id,
            @Valid @RequestBody ReturnOrderRequest request) {
        String adminUsername = SecurityUtil.getCurrentUsername();
        orderService.returnOrder(id, request.reason(), adminUsername);
        return ResponseEntity.ok(ApiResponse.success("Đơn hàng đã được đánh dấu hoàn trả."));
    }

    @PatchMapping("/{id}/request-return")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Yêu cầu trả hàng (Customer)", description = "Khách hàng yêu cầu trả hàng sau khi đơn hàng đã hoàn thành (trong vòng 4 ngày)")
    public ResponseEntity<ApiResponse<Void>> requestReturnByCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody ReturnOrderRequest request) {
        orderService.requestReturnByCustomer(id, request);
        return ResponseEntity
                .ok(ApiResponse.success("Yêu cầu trả hàng của bạn đã được gửi. Vui lòng chờ Admin xử lý."));
    }

    @PatchMapping("/{id}/handle-return")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Xử lý yêu cầu trả hàng (Admin)", description = "Admin/Staff phê duyệt hoặc từ chối yêu cầu trả hàng của khách")
    public ResponseEntity<ApiResponse<Void>> handleReturnRequest(
            @PathVariable UUID id,
            @Valid @RequestBody AdminHandleReturnRequest request) {
        String adminUsername = SecurityUtil.getCurrentUsername();
        orderService.handleReturnRequestByAdmin(id, request, adminUsername);
        String message = request.approved() ? "Đã chấp nhận yêu cầu trả hàng." : "Đã từ chối yêu cầu trả hàng.";
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping(value = "/excel/import", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Nhập đơn hàng từ Excel", description = "Import danh sách đơn hàng (chủ yếu cho đơn offline hoặc legacy data)")
    public ResponseEntity<ApiResponse<OrderExcelService.ImportResult>> importFromExcel(
            @RequestParam("file") MultipartFile file) {
        OrderExcelService.ImportResult result = orderExcelService.importOrdersFromExcel(file);
        String message = String.format("Nhập Excel hoàn tất: tạo mới %d, bỏ qua %d.",
                result.created(), result.skipped());
        return ResponseEntity.ok(ApiResponse.success(message, result));
    }

    @GetMapping("/excel/template")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Tải template nhập đơn hàng", description = "Tải file mẫu Excel để nhập danh sách đơn hàng")
    public void downloadTemplate(HttpServletResponse response) throws java.io.IOException {
        orderExcelService.downloadTemplate(response);
    }
}
