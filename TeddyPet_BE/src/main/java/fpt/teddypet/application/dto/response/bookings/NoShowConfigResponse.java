package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record NoShowConfigResponse(
        Long id,
        Integer gracePeriodMinutes,
        Boolean autoMarkNoShow,
        Boolean forfeitDeposit,
        BigDecimal penaltyAmount,
        Boolean allowLateCheckin,
        Integer lateCheckinMinutes,
        Boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}

