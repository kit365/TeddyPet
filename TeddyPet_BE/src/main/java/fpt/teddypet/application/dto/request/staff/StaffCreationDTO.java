package fpt.teddypet.application.dto.request.staff;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import fpt.teddypet.domain.enums.GenderEnum;
import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO cho Flow A: Tạo hồ sơ nhân viên chỉ (không tạo tài khoản).
 * Dùng cho staff không cần truy cập hệ thống (lau dọn, bảo vệ, ...).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record StaffCreationDTO(

        @JsonProperty("fullName")
        @NotBlank
        @Size(max = 150)
        String fullName,

        @JsonProperty("email")
        @Email
        @Size(max = 255)
        String email,

        @JsonProperty("phoneNumber")
        @Size(max = 20)
        String phoneNumber,

        @JsonProperty("citizenId")
        @Size(max = 50)
        String citizenId,

        @JsonProperty("dateOfBirth")
        LocalDate dateOfBirth,

        @JsonProperty("gender")
        GenderEnum gender,

        @JsonProperty("avatarUrl")
        @Size(max = 500)
        String avatarUrl,

        @JsonProperty("altImage")
        String altImage,

        @JsonProperty("address")
        @Size(max = 500)
        String address,

        @JsonProperty("bankAccountNo")
        @Size(max = 100)
        String bankAccountNo,

        @JsonProperty("bankName")
        @Size(max = 150)
        String bankName,

        @JsonProperty("positionId")
        @NotNull(message = "Chức vụ không được để trống")
        Long positionId,

        @JsonProperty("secondaryPositionId")
        Long secondaryPositionId,

        @JsonProperty("employmentType")
        @NotNull(message = "Loại hình công việc không được để trống")
        EmploymentTypeEnum employmentType
) {
}
