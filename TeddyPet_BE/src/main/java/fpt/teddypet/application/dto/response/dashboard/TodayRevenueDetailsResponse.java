package fpt.teddypet.application.dto.response.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record TodayRevenueDetailsResponse(
        BigDecimal totalRevenue,
        int completedOrdersCount,
        int completedBookingsCount,
        List<TodayRevenueOrderDto> orders,
        List<TodayRevenueBookingDto> bookings
) {
}
