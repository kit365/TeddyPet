package fpt.teddypet.application.dto.response.staff;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import fpt.teddypet.domain.enums.staff.ShiftStatus;

import java.time.LocalDateTime;

/**
 * Response ca làm việc (model mới: startTime/endTime, status ShiftStatus).
 * Các trường giờ được serialize kèm múi giờ +07:00 (VN) để frontend hiển thị đúng.
 */
public record WorkShiftResponse(
        Long shiftId,
        Long staffId,
        String staffFullName,
        @JsonSerialize(using = VietnamLocalDateTimeSerializer.class)
        LocalDateTime startTime,
        @JsonSerialize(using = VietnamLocalDateTimeSerializer.class)
        LocalDateTime endTime,
        ShiftStatus status,
        @JsonSerialize(using = VietnamLocalDateTimeSerializer.class)
        LocalDateTime checkInTime,
        @JsonSerialize(using = VietnamLocalDateTimeSerializer.class)
        LocalDateTime checkOutTime,
        Long version
) {
}
