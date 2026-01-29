package fpt.teddypet.application.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record UserAddressRequest(
        @NotBlank(message = "Họ tên là bắt buộc") String fullName,

        @NotBlank(message = "Số điện thoại là bắt buộc") String phone,

        @NotBlank(message = "Địa chỉ là bắt buộc") String address,

        Double longitude,
        Double latitude,
        boolean isDefault) {
}
