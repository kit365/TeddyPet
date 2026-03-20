package fpt.teddypet.application.dto.response.dashboard;

import java.math.BigDecimal;

public record DashboardStatsResponse(
        BigDecimal totalRevenue,
        long totalOrders,
        long totalCustomers,
        long totalProducts,
        double avgRating,
        long completedBookings,
        long pendingOrders,
        long confirmedOrders,
        long processingOrders,
        long deliveringOrders,
        long deliveredOrders,
        long completedOrders,
        long cancelledOrders,
        long returnedOrders,
        long todayOrders,
        BigDecimal todayRevenue,
        long lowStockCount,
        long todayBookings) {
}
