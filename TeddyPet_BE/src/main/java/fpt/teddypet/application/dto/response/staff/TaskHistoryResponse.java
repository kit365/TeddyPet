package fpt.teddypet.application.dto.response.staff;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TaskHistoryResponse(
        Long id,
        Long staffId,
        UUID bookingItemId,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        BigDecimal earnedCommission
) {
}

