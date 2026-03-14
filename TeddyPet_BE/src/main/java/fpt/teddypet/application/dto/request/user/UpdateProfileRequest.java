package fpt.teddypet.application.dto.request.user;

import fpt.teddypet.domain.enums.GenderEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank(message = "Họ không được để trống") String lastName,

        @NotBlank(message = "Tên không được để trống") String firstName,

        @Pattern(regexp = "^(0|\\+84)(\\s|\\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)(\\s|\\.)?(\\d{3})(\\s|\\.)?(\\d{3})$", message = "Số điện thoại không hợp lệ") String phoneNumber,

        @Past(message = "Ngày sinh phải là một ngày trong quá khứ") LocalDate dateOfBirth,

        GenderEnum gender,
        
        String optionalEmail) {
}
