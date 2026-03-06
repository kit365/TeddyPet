package fpt.teddypet.application.dto.request.staff;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Gán một slot lịch cố định cho nhân viên (thứ + sáng/chiều + vai trò).
 */
public record StaffFixedScheduleRequest(
        @NotNull Long staffId,
        @NotNull Long positionId,
        @Min(1) @Max(7) int dayOfWeek,
        boolean isAfternoon
) {
}
