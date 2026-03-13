package fpt.teddypet.presentation.controller.dashboard;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.dashboard.DashboardStatsResponse;
import fpt.teddypet.application.dto.response.dashboard.RevenueChartItem;
import fpt.teddypet.application.dto.response.orders.order.OrderResponse;
import fpt.teddypet.application.dto.request.orders.order.OrderSearchRequest;
import fpt.teddypet.application.dto.response.dashboard.*;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.service.dashboard.DashboardService;
import fpt.teddypet.application.port.input.orders.order.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final OrderService orderService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(
                "Dashboard statistics retrieved successfully",
                dashboardService.getStats()));
    }

    @GetMapping("/staff-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStaffStats() {
        return ResponseEntity.ok(ApiResponse.success(
                "Staff Dashboard statistics retrieved successfully",
                dashboardService.getStaffStats()));
    }

    @GetMapping("/revenue-chart")
    public ResponseEntity<ApiResponse<List<RevenueChartItem>>> getRevenueChart(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(
                "Revenue chart data retrieved successfully",
                dashboardService.getRevenueChart(days)));
    }

    @GetMapping("/recent-orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getRecentOrders(
            @RequestParam(defaultValue = "10") int limit) {
        var request = new OrderSearchRequest(0, limit, null, "createdAt", "DESC");
        var page = orderService.getAllOrders(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Recent orders retrieved successfully",
                page.content()));
    }

    @GetMapping("/sales-by-category")
    public ResponseEntity<ApiResponse<List<SalesByCategoryResponse>>> getSalesByCategory() {
        return ResponseEntity.ok(ApiResponse.success(
                "Sales by category retrieved successfully",
                dashboardService.getSalesByCategory()));
    }

    @GetMapping("/top-customers")
    public ResponseEntity<ApiResponse<List<TopCustomerResponse>>> getTopCustomers() {
        return ResponseEntity.ok(ApiResponse.success(
                "Top customers retrieved successfully",
                dashboardService.getTopCustomers()));
    }

    @GetMapping("/latest-products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLatestProducts() {
        return ResponseEntity.ok(ApiResponse.success(
                "Latest products retrieved successfully",
                dashboardService.getLatestProducts()));
    }

    @GetMapping("/pet-distribution")
    public ResponseEntity<ApiResponse<List<PetDistributionResponse>>> getPetDistribution() {
        return ResponseEntity.ok(ApiResponse.success(
                "Pet distribution retrieved successfully",
                dashboardService.getPetDistribution()));
    }

    @GetMapping("/service-statistics")
    public ResponseEntity<ApiResponse<List<ServiceStatisticsResponse>>> getServiceStatistics() {
        return ResponseEntity.ok(ApiResponse.success(
                "Service statistics retrieved successfully",
                dashboardService.getServiceStatistics()));
    }
}
