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
        long todayBookings,
        /** Số khách đặt lịch (phân biệt theo user / SĐT+email / từng booking khách vãng lai), không tính đơn hủy & booking tạm. */
        long bookingCustomersExcludingCancelled,
        /** Số booking (trong kỳ) đã thanh toán đủ: payment_status = PAID, không hủy. */
        long bookingFullyPaidCount,
        /** Số lượt cọc đã thanh toán (deposit_paid hoặc status PAID), theo thời điểm thanh toán cọc. */
        long bookingDepositsPaidCount,
        /** Tổng số tiền cọc đã hoàn (theo booking_deposits.refund_amount khi refunded). */
        BigDecimal bookingDepositsRefundedTotal,
        /** Số đơn đặt lịch đã hủy (theo cancelled_at hoặc cập nhật gần nhất trong kỳ). */
        long bookingCancelledCount) {
}
