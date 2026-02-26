package fpt.teddypet.application.dto.response.staff;

import fpt.teddypet.domain.enums.staff.ShiftStatus;

import java.time.LocalDateTime;

/**
 * Response ca làm việc (model mới: startTime/endTime, status ShiftStatus).
 */
public record WorkShiftResponse(
        Long shiftId,
        Long staffId,
        String staffFullName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        ShiftStatus status,
        LocalDateTime checkInTime,
        LocalDateTime checkOutTime,
        Long version
) {
}
