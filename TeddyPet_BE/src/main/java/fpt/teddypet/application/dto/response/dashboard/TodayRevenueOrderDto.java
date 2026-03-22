package fpt.teddypet.application.dto.response.dashboard;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TodayRevenueOrderDto(
        UUID orderId,
        String orderCode,
        String customerName,
        BigDecimal finalAmount,
        String status,
        LocalDateTime createdAt
) {
}
