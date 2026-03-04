package fpt.teddypet.application.dto.response.shop;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalTime;
import java.time.LocalDateTime;

public record ShopOperationHourResponse(
        Long id,
        Integer dayOfWeek,
        LocalTime openTime,
        LocalTime closeTime,
        @JsonProperty("isDayOff")
        boolean isDayOff,
        LocalTime breakStartTime,
        LocalTime breakEndTime,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
