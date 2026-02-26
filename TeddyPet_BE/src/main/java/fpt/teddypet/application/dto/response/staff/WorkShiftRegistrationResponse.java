package fpt.teddypet.application.dto.response.staff;

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
        RegistrationStatus status,
        LocalDateTime registeredAt
) {
}
