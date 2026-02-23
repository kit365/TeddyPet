package fpt.teddypet.application.dto.response.shop;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TimeSlotExceptionResponse(
        Long id,
        Long serviceId,
        String timeExceptionName,
        LocalDate startDate,
        LocalDate endDate,
        String scope,
        String exceptionType,
        String reason,
        @JsonProperty("isRecurring")
        boolean isRecurring,
        String recurrencePattern,
        @JsonProperty("isActive")
        boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
