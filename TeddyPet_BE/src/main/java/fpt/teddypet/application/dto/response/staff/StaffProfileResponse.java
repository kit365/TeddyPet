package fpt.teddypet.application.dto.response.staff;

import fpt.teddypet.domain.enums.GenderEnum;
import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;

import java.time.LocalDate;
import java.util.UUID;

public record StaffProfileResponse(
        Long staffId,
        UUID userId,       // null khi chưa liên kết tài khoản
        String username,   // null khi chưa liên kết tài khoản
        String fullName,
        String email,
        String phoneNumber,
        String citizenId,
        LocalDate dateOfBirth,
        GenderEnum gender,
        String avatarUrl,
        String altImage,
        String address,
        String bankAccountNo,
        String bankName,
        Long positionId,
        String positionCode,
        String positionName,
        EmploymentTypeEnum employmentType,
        String backupEmail,
        String googleWhitelistStatus, // PENDING, ACCEPTED, EXPIRED, null
        boolean active
) {
}

