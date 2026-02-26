package fpt.teddypet.application.dto.request.shop;

import fpt.teddypet.domain.enums.scheduling.DayTypeEnum;
import fpt.teddypet.domain.enums.scheduling.SlotTypeEnum;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record TimeSlotUpsertRequest(
        Long id,
        @NotNull(message = "Service ID là bắt buộc")
        Long serviceId,
        @NotNull(message = "Loại ngày là bắt buộc")
        DayTypeEnum dayType,
        @NotNull(message = "Giờ bắt đầu là bắt buộc")
        LocalTime startTime,
        @NotNull(message = "Giờ kết thúc là bắt buộc")
        LocalTime endTime,
        Integer maxCapacity,
        SlotTypeEnum slotType,
        String notes
) {
}
