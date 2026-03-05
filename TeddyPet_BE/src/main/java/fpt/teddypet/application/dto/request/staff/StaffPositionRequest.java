package fpt.teddypet.application.dto.request.staff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StaffPositionRequest(
        @NotBlank(message = "Mã chức vụ không được để trống")
        @Size(max = 50, message = "Mã chức vụ không được vượt quá 50 ký tự")
        String code,

        @NotBlank(message = "Tên chức vụ không được để trống")
        @Size(max = 150, message = "Tên chức vụ không được vượt quá 150 ký tự")
        String name,

        @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
        String description
) {
}
