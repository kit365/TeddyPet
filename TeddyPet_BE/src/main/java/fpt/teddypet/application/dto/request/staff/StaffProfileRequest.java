package fpt.teddypet.application.dto.request.staff;

import fpt.teddypet.domain.enums.GenderEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record StaffProfileRequest(
        @Size(max = 150)
        String fullName,

        @Email
        @Size(max = 255)
        String email,

        @Size(max = 20)
        String phoneNumber,

        @Size(max = 50)
        String citizenId,

        LocalDate dateOfBirth,

        GenderEnum gender,

        @Size(max = 500)
        String avatarUrl,

        String altImage,

        @Size(max = 500)
        String address,

        @Size(max = 100)
        String bankAccountNo,

        @Size(max = 150)
        String bankName,

        LocalDate hireDate,

        Long positionId
) {
}

