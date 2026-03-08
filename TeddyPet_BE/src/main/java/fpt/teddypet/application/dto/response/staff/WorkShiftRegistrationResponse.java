package fpt.teddypet.application.dto.response.staff;

import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;
import fpt.teddypet.domain.enums.staff.RegistrationStatus;

import java.time.LocalDateTime;

/**
 * Response đăng ký ca làm việc của nhân viên.
 */
public record WorkShiftRegistrationResponse(
        Long registrationId,
        Long workShiftId,
        Long staffId,
        String staffFullName,
        String roleAtRegistrationName,
        EmploymentTypeEnum workType,
        RegistrationStatus status,
        LocalDateTime registeredAt,
        /** Quyết định admin: APPROVED_LEAVE / REJECTED_LEAVE; null = chưa chọn. Chỉ có khi status = PENDING_LEAVE. */
        String leaveDecision
) {
}
