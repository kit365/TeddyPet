package fpt.teddypet.application.dto.response.staff;

/**
 * Một mục lịch cố định của nhân viên.
 */
public record StaffFixedScheduleResponse(
        Long scheduleId,
        Long staffId,
        String staffFullName,
        Long positionId,
        String positionName,
        int dayOfWeek,
        boolean isAfternoon
) {
}
