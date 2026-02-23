package fpt.teddypet.application.dto.response.shop;

import com.fasterxml.jackson.annotation.JsonProperty;
import fpt.teddypet.domain.enums.scheduling.DayTypeEnum;
import fpt.teddypet.domain.enums.scheduling.SlotTypeEnum;

import java.time.LocalTime;

public record TimeSlotResponse(
        Long id,
        Long serviceId,
        DayTypeEnum dayType,
        LocalTime startTime,
        LocalTime endTime,
        Integer maxCapacity,
        Integer currentBookings,
        SlotTypeEnum slotType,
        String notes,
        String status,
        @JsonProperty("version")
        Long version
) {
}
