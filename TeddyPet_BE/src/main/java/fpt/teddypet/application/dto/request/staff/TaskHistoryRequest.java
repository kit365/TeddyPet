package fpt.teddypet.application.dto.request.staff;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TaskHistoryRequest(
        @NotNull
        Long staffId,

        @NotNull
        UUID bookingItemId,

        LocalDateTime startedAt,

        LocalDateTime finishedAt,

        @NotNull
        BigDecimal earnedCommission
) {
}

