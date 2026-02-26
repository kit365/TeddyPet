package fpt.teddypet.application.dto.response.staff;

import fpt.teddypet.domain.enums.staff.StaffRealtimeStatusEnum;

import java.time.LocalDateTime;
import java.util.UUID;

public record StaffRealtimeResponse(
        Long staffId,
        StaffRealtimeStatusEnum currentStatus,
        UUID currentBookingId,
        LocalDateTime lastUpdated
) {
}

