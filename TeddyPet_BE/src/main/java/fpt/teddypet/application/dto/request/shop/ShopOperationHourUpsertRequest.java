package fpt.teddypet.application.dto.request.shop;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record ShopOperationHourUpsertRequest(
        Long id,
        @NotNull(message = "Thứ trong tuần là bắt buộc")
        @Min(1) @Max(7) // 1=Monday, 7=Sunday
        Integer dayOfWeek,
        LocalTime openTime,
        LocalTime closeTime,
        Boolean isDayOff,
        LocalTime breakStartTime,
        LocalTime breakEndTime
) {
}
